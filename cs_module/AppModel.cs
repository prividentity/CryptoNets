using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;
using System.Windows;
using System.Windows.Input;
using Emgu.CV;
using Emgu.CV.Structure;
using System.Windows.Media;
using DirectShowLib;
using PrivateIdentity;

namespace PrivId.Demo;

internal sealed class AppModel : INotifyPropertyChanged
{
    private const String ServerUrl = "";

    private const String ApiKey = "";

    private sealed class CommandHandler : ICommand
    {
        private readonly Func<Boolean> _canExecute;

        private readonly Action _action;

        public CommandHandler(Action action, Func<Boolean> canExecute)
        {
            _action = action;
            _canExecute = canExecute;
        }

        public Boolean CanExecute(Object? parameter) => _canExecute.Invoke();

        public void Execute(Object? parameter) => _action?.Invoke();

        public event EventHandler? CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }
    }

    private readonly SynchronizationContext? _synchronizationContext;

    private SpinLock _lock = new (false);

    private String _diagnosticMessage = String.Empty;
    
    private readonly WriteableBitmap _writableBitmap;

    //private readonly privid_fhe_face _privIdFace;

    private readonly IFaceModule _faceModule;

    private Boolean _predictRunning;

    private Boolean _enrollRunning;

    private Boolean _isValidRunning;

    private VideoCapture? _capture;

    private Int32 _cameraIndex;

    private String? _uuid;

    public AppModel()
    {
        _synchronizationContext = SynchronizationContext.Current;
        CvInvoke.UseOpenCL = false;

        Cameras = new ObservableCollection<DsDevice>(
            DsDevice.GetDevicesOfCat(FilterCategory.VideoInputDevice));
        if (Cameras.Count > 0)
        {
            CameraIndex = 0;
        }

        LocalStorage.TryConfigureLocalStorage("privid_local_storage1");
        _faceModule = Factory.GetFaceModule(new ModuleSettings(new Uri(ServerUrl), ApiKey));

        _writableBitmap = new WriteableBitmap(
            640, 480, 96, 96, PixelFormats.Bgr24, null);

        IsValidCommand = new CommandHandler(CleanupDiagnosticMessage, () => !PredictRunning && !EnrollRunning);
        PredictCommand = new CommandHandler(CleanupDiagnosticMessage, () => !IsValidRunning && !EnrollRunning);
        EnrollCommand = new CommandHandler(CleanupDiagnosticMessage, () => !IsValidRunning && !PredictRunning);
        DeleteCommand = new CommandHandler(DeleteEnrolledFace, () => !String.IsNullOrEmpty(_uuid));
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    public ObservableCollection<DsDevice> Cameras { get; }

    public BitmapSource Bitmap => _writableBitmap;

    public String DiagnosticMessage
    {
        get => _diagnosticMessage;
        private set => SetField(ref _diagnosticMessage, value);
    }

    public Boolean IsValidRunning
    {
        get => _isValidRunning;
        set => SetField(ref _isValidRunning, value);
    }

    public Boolean PredictRunning
    {
        get => _predictRunning;
        set => SetField(ref _predictRunning, value);
    }

    public Boolean EnrollRunning
    {
        get => _enrollRunning;
        set => SetField(ref _enrollRunning, value);
    }

    public Int32 CameraIndex
    {
        get => _cameraIndex;
        set
        {
            SetField(ref _cameraIndex, value);
            StartCameraCapturing();
        }
    }

    public ICommand IsValidCommand { get; }

    public ICommand PredictCommand { get; }

    public ICommand EnrollCommand { get; }

    public ICommand DeleteCommand { get; }

    private void StartCameraCapturing()
    {
        try
        {
            if (_capture != null)
            {
                _capture.ImageGrabbed -= HandleImageGrabbed;
                _capture.Stop();
                _capture.Dispose();
            }

            _capture = new VideoCapture(CameraIndex);
            _capture.ImageGrabbed += HandleImageGrabbed;

            _capture.Start();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }

    private void HandleImageGrabbed(Object? sender, EventArgs e)
    {
        using var frame = new Mat();
        _capture?.Retrieve(frame);

        _synchronizationContext?.Send(state =>
        {
            var image = state as Image<Bgr, Byte>;

            _writableBitmap.WritePixels(new Int32Rect(0, 0, image!.Width, image.Height),
                image.MIplImage.ImageData, image.MIplImage.ImageSize, image.MIplImage.WidthStep);

            Task.Run(() => ProcessFrame(image));
        }, frame.ToImage<Bgr, Byte>());
    }

    private async Task ProcessFrame(Image<Bgr, Byte> image)
    {
        using var _ = image;

        var lockTaken = false;
        _lock.TryEnter(ref lockTaken);
        if (!lockTaken)
        {
            return;
        }

        try
        {
            if (IsValidRunning)
            {
                var result = _faceModule.Validate(new ImageData(
                    image.MIplImage.ImageData, image.Width, image.Height, image.MIplImage.ImageSize));
                DiagnosticMessage = result.Result.ToString();
                return;
            }

            if (PredictRunning)
            {
                var result = await _faceModule.PredictAsync(new ImageData(
                    image.MIplImage.ImageData, image.Width, image.Height, image.MIplImage.ImageSize));
                _uuid = result.Uuid;
                if (String.IsNullOrEmpty(_uuid))
                {
                    DiagnosticMessage = result.Message;
                }
                else
                {
                    DiagnosticMessage = $"Predicted with UUID: {_uuid}";
                    PredictRunning = false;
                    CommandManager.InvalidateRequerySuggested();
                }
                return;
            }

            if (EnrollRunning)
            {
                var result = await _faceModule.EnrollAsync(new ImageData(
                    image.MIplImage.ImageData, image.Width, image.Height, image.MIplImage.ImageSize));
                _uuid = result.Uuid;
                if (String.IsNullOrEmpty(_uuid))
                {
                    DiagnosticMessage = result.Message;
                }
                else
                {
                    DiagnosticMessage = $"Predicted with UUID: {_uuid}";
                    PredictRunning = false;
                    CommandManager.InvalidateRequerySuggested();
                }
                return;
            }

            CleanupDiagnosticMessage();
        }
        finally
        {
            _lock.Exit();
        }
    }

    private void CleanupDiagnosticMessage() => DiagnosticMessage = String.Empty;

    private void DeleteEnrolledFace()
    {
        IsValidRunning = EnrollRunning = PredictRunning = false;
        //DiagnosticMessage = _privIdFace.delete(_uuid);
        _uuid = null;
    }

    private void OnPropertyChanged([CallerMemberName] String? propertyName = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

    private Boolean SetField<T>(ref T field, T value, [CallerMemberName] String? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
        {
            return false;
        }

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}