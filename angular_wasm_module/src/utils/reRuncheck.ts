export default class Rerun {
  Action: any;
  RerunId: any;
  RerunAction: boolean;
  Clearing: boolean;
  constructor(action: any) {
    this.Action = action;
    this.RerunId = null;
    this.Clearing = false;
    this.RerunAction = true;
  }

  doInterval = () => {
    if (!this.RerunId) {
      this.RerunId = setInterval(() => {
        if (this.RerunAction) {
          this.Action();
        }
        if (!this.Clearing) {
          this.RerunAction = true;
        }
      }, 5000);
      this.Clearing = false;
    }
  };

  clearCheck = () => {
    this.Clearing = true;
    clearInterval(this.RerunId);
    this.RerunId = null;
  };
}
