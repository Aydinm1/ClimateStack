import { useRef, useCallback, useEffect, useState } from 'react'
import Map, { Source, Layer, Marker, Popup } from 'react-map-gl'
import { riskColor, riskScoreToGradient } from '../utils/riskColors'
import { formatTemp, formatVisibility } from '../utils/formatters'
import RiskBadge from './RiskBadge'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export default function DavisMap({ risks, sensors }) {
  const [popup, setPopup] = useState(null)

  const riskGeoJSON = {
    type: 'FeatureCollection',
    features: (risks || []).map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: {
        node_id: r.node_id,
        name: r.name,
        combined_risk: r.combined_risk,
        risk_level: r.risk_level,
        heat_risk: r.heat_risk,
        fog_risk: r.fog_risk,
        temp_f: r.temp_f,
        visibility_ft: r.visibility_ft,
      },
    })),
  }

  const heatGeoJSON = {
    type: 'FeatureCollection',
    features: (sensors || []).map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: {
        temp: s.temp_f,
        intensity: Math.max(0, (s.temp_f - 90) / 30),
      },
    })),
  }

  const fogGeoJSON = {
    type: 'FeatureCollection',
    features: (sensors || [])
      .filter((s) => s.visibility_ft < 2000)
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          visibility: s.visibility_ft,
          opacity: Math.min(0.7, (2000 - s.visibility_ft) / 2000),
          radius: Math.max(20, ((2000 - s.visibility_ft) / 2000) * 80),
        },
      })),
  }

  const selectedRisk = popup
    ? (risks || []).find((r) => r.node_id === popup)
    : null
  const selectedSensor = popup
    ? (sensors || []).find((s) => s.node_id === popup)
    : null

  return (
    <Map
      initialViewState={{
        longitude: -121.7413,
        latitude: 38.5451,
        zoom: 15.5,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
    >
      {/* Heat heatmap layer */}
      <Source id="heat-source" type="geojson" data={heatGeoJSON}>
        <Layer
          id="heat-layer"
          type="heatmap"
          paint={{
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': [
              'interpolate', ['linear'], ['zoom'],
              12, 0.3,
              14, 0.8,
              16, 1.5,
            ],
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'],
              12, 8,
              14, 20,
              16, 50,
            ],
            'heatmap-opacity': [
              'interpolate', ['linear'], ['zoom'],
              12, 0.3,
              14, 0.5,
              16, 0.6,
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(0,0,255,0.3)',
              0.4, 'rgba(0,255,255,0.5)',
              0.6, 'rgba(255,255,0,0.7)',
              0.8, 'rgba(255,128,0,0.8)',
              1, 'rgba(255,0,0,0.9)',
            ],
          }}
        />
      </Source>

      {/* Fog circles layer */}
      <Source id="fog-source" type="geojson" data={fogGeoJSON}>
        <Layer
          id="fog-layer"
          type="circle"
          paint={{
            'circle-radius': ['get', 'radius'],
            'circle-color': 'rgba(200, 200, 220, 0.4)',
            'circle-opacity': ['get', 'opacity'],
            'circle-blur': 0.8,
          }}
        />
      </Source>

      {/* Risk markers */}
      {(risks || []).map((r) => (
        <Marker
          key={r.node_id}
          longitude={r.lng}
          latitude={r.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setPopup(r.node_id)
          }}
        >
          <div
            style={{
              width: r.combined_risk >= 75 ? 16 : 12,
              height: r.combined_risk >= 75 ? 16 : 12,
              borderRadius: '50%',
              background: riskScoreToGradient(r.combined_risk),
              border: '2px solid white',
              cursor: 'pointer',
              boxShadow: `0 0 ${r.combined_risk >= 75 ? 12 : 6}px ${riskScoreToGradient(r.combined_risk)}`,
              animation: r.combined_risk >= 75 ? 'pulse 1.5s infinite' : 'none',
            }}
          />
        </Marker>
      ))}

      {/* Popup */}
      {selectedRisk && (
        <Popup
          longitude={selectedRisk.lng}
          latitude={selectedRisk.lat}
          onClose={() => setPopup(null)}
          closeOnClick={true}
          anchor="bottom"
          maxWidth="280px"
        >
          <div style={{ color: '#111', padding: 4 }}>
            <strong>{selectedRisk.name}</strong>
            <div style={{ marginTop: 4 }}>
              <RiskBadge level={selectedRisk.risk_level} score={selectedRisk.combined_risk} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12 }}>
              <div>Temp: {formatTemp(selectedRisk.temp_f)}</div>
              <div>Visibility: {formatVisibility(selectedRisk.visibility_ft)}</div>
              <div>Heat Risk: {Math.round(selectedRisk.heat_risk)}</div>
              <div>Fog Risk: {Math.round(selectedRisk.fog_risk)}</div>
              {selectedRisk.contributing_factors?.map((f, i) => (
                <div key={i} style={{ color: '#666', fontSize: 11 }}>• {f}</div>
              ))}
            </div>
          </div>
        </Popup>
      )}
    </Map>
  )
}
