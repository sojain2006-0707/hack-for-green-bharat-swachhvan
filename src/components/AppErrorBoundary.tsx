import * as React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: unknown;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep this lightweight; we don't want the boundary to crash.
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message =
      this.state.error instanceof Error
        ? this.state.error.message
        : "Something went wrong.";

    return (
      <div className="min-h-screen bg-[#F7F2DE] px-6 py-10">
        <div className="mx-auto max-w-md rounded-3xl bg-white/85 p-6 ring-1 ring-black/5 backdrop-blur">
          <div className="text-lg font-semibold tracking-tight text-foreground">We hit a snag</div>
          <div className="mt-2 text-sm text-muted-foreground">
            The app encountered an unexpected error. You can try reloading.
          </div>

          <div className="mt-4 rounded-2xl bg-black/5 p-3 text-xs text-foreground/80">
            {message}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={this.reload}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.goHome}
              className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground ring-1 ring-black/10 hover:bg-white/80"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
