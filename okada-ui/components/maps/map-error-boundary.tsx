"use client";

import { Component, type ReactNode } from "react";

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-error-boundary" role="alert">
          <div className="map-empty-note-card">
            <strong>{this.props.fallbackTitle ?? "Map unavailable"}</strong>
            <p>
              {this.props.fallbackDescription ??
                "The map could not be loaded. Please try refreshing the page."}
            </p>
            {process.env.NODE_ENV === "development" && this.state.error ? (
              <p style={{ marginTop: 8, fontSize: "0.75rem", color: "#94a3b8" }}>
                {this.state.error.message}
              </p>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
