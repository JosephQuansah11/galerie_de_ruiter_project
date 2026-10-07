import { Component, type ReactElement } from "react";

export class ViewerErrorBoundary extends Component<{
  children: ReactElement;
  unavailableText: string;
}, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <div className="three-d-viewer-fallback" role="status">{this.props.unavailableText}</div>;
    return this.props.children;
  }
}
