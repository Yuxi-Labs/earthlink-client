/**
 * deck.gl + Cesium Integration Utilities
 * 
 * This module provides utilities for overlaying deck.gl visualization layers
 * on top of a Cesium 3D globe. This enables:
 * - Cinematic 3D globe experience (Cesium)
 * - Rich data visualizations (deck.gl heatmaps, arcs, trajectories, etc.)
 * 
 * Architecture:
 * - 2D: MapLibre (basemap) + deck.gl (viz)
 * - 2.5D: MapLibre (basemap) + deck.gl (viz with pitch)
 * - 3D: Cesium (3D globe) + deck.gl (viz overlay)
 * 
 * Future enhancements:
 * - Agent trajectory arcs (GreatCircleLayer, ArcLayer)
 * - Knowledge heatmaps (HeatmapLayer, HexagonLayer)
 * - Interaction zones (GeoJsonLayer with elevation)
 * - Real-time data streams (TripsLayer for movement)
 */

import type { Layer } from '@deck.gl/core';
import { Viewer as CesiumViewer } from 'cesium';

/**
 * Configuration for deck.gl overlay on Cesium
 */
export interface DeckGLCesiumConfig {
  viewer: CesiumViewer;
  layers: Layer[];
  onViewStateChange?: (viewState: any) => void;
}

/**
 * Sync deck.gl view state with Cesium camera
 * 
 * This will be used to:
 * 1. Convert Cesium camera position to deck.gl view state
 * 2. Keep deck.gl overlays aligned with Cesium globe as user navigates
 * 
 * @param viewer - Cesium Viewer instance
 * @returns deck.gl compatible view state
 */
export function getCesiumViewState(viewer: CesiumViewer) {
  const camera = viewer.camera;
  const cartographic = camera.positionCartographic;
  
  return {
    longitude: (cartographic.longitude * 180) / Math.PI,
    latitude: (cartographic.latitude * 180) / Math.PI,
    altitude: cartographic.height,
    bearing: camera.heading * (180 / Math.PI),
    pitch: camera.pitch * (180 / Math.PI),
  };
}

/**
 * Initialize deck.gl overlay on Cesium viewer
 * 
 * This will create a canvas overlay on top of Cesium and render deck.gl layers
 * synchronized with the Cesium camera movements.
 * 
 * TODO: Implement full integration when adding advanced visualizations
 * 
 * @param config - Configuration for deck.gl + Cesium integration
 */
export function initializeDeckGLOverlay(_config: DeckGLCesiumConfig) {
  // This will be implemented when we add advanced deck.gl visualizations
  // to the 3D globe view (trajectories, heatmaps, etc.)
  
  console.log('[DeckGL-Cesium] Integration utilities loaded');
  console.log('[DeckGL-Cesium] Ready for overlay implementation');
  
  // Future implementation will:
  // 1. Create deck.gl overlay canvas
  // 2. Sync camera with Cesium viewer
  // 3. Render deck.gl layers on top
  // 4. Handle pointer events
  
  return {
    destroy: () => {
      // Cleanup logic
    },
  };
}

/**
 * Common deck.gl layers for all view modes
 * These can be used across 2D, 2.5D, and 3D views
 */
export const COMMON_LAYER_CONFIG = {
  pickable: true,
  autoHighlight: true,
  highlightColor: [255, 255, 255, 128],
};

/**
 * Agent visualization layer configurations
 * Optimized for different view modes
 */
export const AGENT_VIZ_CONFIG = {
  '2d': {
    radiusScale: 1,
    radiusMinPixels: 8,
    radiusMaxPixels: 16,
    glowRadius: 20,
  },
  '2.5d': {
    radiusScale: 1.2,
    radiusMinPixels: 10,
    radiusMaxPixels: 20,
    glowRadius: 25,
  },
  '3d': {
    radiusScale: 1.5,
    radiusMinPixels: 12,
    radiusMaxPixels: 24,
    glowRadius: 30,
  },
};
