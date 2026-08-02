import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  MapPin,
  Navigation,
  Compass,
  Building2,
  Users,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  PlusCircle,
  Eye,
  Info,
  Globe,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { WorshipPlace, Religion } from '../types';

interface WorshipMapGridProps {
  worshipPlaces: WorshipPlace[];
  joinedPlaceIds: string[];
  onToggleJoin: (placeId: string) => void;
  onSelectPlace?: (place: WorshipPlace) => void;
}

// Religion color mapping
const RELIGION_COLORS: Record<Religion, { bg: string; border: string; text: string; hex: string }> = {
  Islam: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', hex: '#10b981' },
  Christianity: { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-400', hex: '#6366f1' },
  Hinduism: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400', hex: '#f59e0b' },
  Judaism: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400', hex: '#06b6d4' },
  Sikhism: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', hex: '#f97316' },
  Buddhism: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', hex: '#a855f7' },
  Other: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400', hex: '#64748b' },
};

// Preset Reference Locations
const PRESET_USER_LOCATIONS = [
  { name: 'Manchester, UK', lat: 53.4808, lng: -2.2426 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Chicago, USA', lat: 41.8781, lng: -87.6298 },
  { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Melbourne, Australia', lat: -37.8136, lng: 144.9631 },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Karachi, Pakistan', lat: 24.8607, lng: 67.0011 },
];

// Haversine distance calculator in Kilometers
function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const WorshipMapGrid: React.FC<WorshipMapGridProps> = ({
  worshipPlaces,
  joinedPlaceIds,
  onToggleJoin,
  onSelectPlace,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // User location reference
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number; name: string }>({
    lat: 53.4808,
    lng: -2.2426,
    name: 'Manchester, UK',
  });
  const [isLocating, setIsLocating] = useState(false);

  // Filters
  const [selectedReligion, setSelectedReligion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(15000); // global default
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<{
    place: WorshipPlace;
    x: number;
    y: number;
    distanceKm: number;
  } | null>(null);

  // Filtered places with coordinates
  const placesWithCoords = useMemo(() => {
    return worshipPlaces.map((p) => {
      // Provide default fallback lat/lng based on city if not present
      let lat = p.lat;
      let lng = p.lng;
      if (lat === undefined || lng === undefined) {
        if (p.city.toLowerCase().includes('manchester')) {
          lat = 53.4808;
          lng = -2.2426;
        } else if (p.city.toLowerCase().includes('chicago')) {
          lat = 41.8781;
          lng = -87.6298;
        } else if (p.city.toLowerCase().includes('toronto')) {
          lat = 43.6532;
          lng = -79.3832;
        } else if (p.city.toLowerCase().includes('melbourne')) {
          lat = -37.8136;
          lng = 144.9631;
        } else if (p.city.toLowerCase().includes('birmingham')) {
          lat = 52.4862;
          lng = -1.8904;
        } else {
          lat = 25.0;
          lng = 0.0;
        }
      }
      const dist = calculateHaversineDistanceKm(userLoc.lat, userLoc.lng, lat, lng);
      return {
        ...p,
        lat,
        lng,
        distanceKm: dist,
      };
    });
  }, [worshipPlaces, userLoc]);

  // Filtered list
  const filteredPlaces = useMemo(() => {
    return placesWithCoords.filter((p) => {
      const matchesReligion =
        selectedReligion === 'All' || p.religion === selectedReligion;
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.religion.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDistance = p.distanceKm <= maxDistanceKm;
      return matchesReligion && matchesSearch && matchesDistance;
    });
  }, [placesWithCoords, selectedReligion, searchQuery, maxDistanceKm]);

  // Selected Place object
  const activeSelectedPlace = useMemo(() => {
    return placesWithCoords.find((p) => p.id === selectedPlaceId) || null;
  }, [placesWithCoords, selectedPlaceId]);

  // GPS Locate Action
  const handleGPSLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My GPS Location',
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  // Render D3 Coordinate Canvas
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Map Projection: D3 Mercator
    const projection = d3
      .geoMercator()
      .scale((width / 620) * 90)
      .center([10, 20])
      .translate([width / 2, height / 2]);

    // Zoom container group
    const g = svg.append('g').attr('class', 'map-group');

    // D3 Zoom behaviour
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 1. Draw Grid Lines (Graticule)
    const graticule = d3.geoGraticule().step([30, 30]);

    // Path generator
    const pathGenerator = d3.geoPath().projection(projection);

    // Background rect
    g.append('rect')
      .attr('width', width * 3)
      .attr('height', height * 3)
      .attr('x', -width)
      .attr('y', -height)
      .attr('fill', '#090d16');

    // Graticule grid mesh
    g.append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', pathGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.75)
      .attr('stroke-dasharray', '3 3');

    // Equator line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', projection([0, 0])![1])
      .attr('x2', width)
      .attr('y2', projection([0, 0])![1])
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    // Prime meridian
    g.append('line')
      .attr('x1', projection([0, 0])![0])
      .attr('y1', 0)
      .attr('x2', projection([0, 0])![0])
      .attr('y2', height)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    // 2. Draw Distance Concentric Rings from User Location
    const userXY = projection([userLoc.lng, userLoc.lat]);
    if (userXY) {
      const ringGroup = g.append('g').attr('class', 'distance-rings');

      // Distance circles in pixels (approx conversion)
      const ranges = [
        { km: 500, label: '500 km' },
        { km: 2000, label: '2,000 km' },
        { km: 5000, label: '5,000 km' },
      ];

      ranges.forEach((r) => {
        // Approximate pixel radius using projection of offset point
        const offsetPt = projection([userLoc.lng + r.km / 111, userLoc.lat]) || [
          userXY[0] + 50,
          userXY[1],
        ];
        const rPx = Math.abs(offsetPt[0] - userXY[0]);

        ringGroup
          .append('circle')
          .attr('cx', userXY[0])
          .attr('cy', userXY[1])
          .attr('r', rPx)
          .attr('fill', 'none')
          .attr('stroke', '#6366f1')
          .attr('stroke-opacity', 0.15)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2 2');

        ringGroup
          .append('text')
          .attr('x', userXY[0] + rPx + 4)
          .attr('y', userXY[1] + 3)
          .attr('fill', '#818cf8')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('opacity', 0.6)
          .text(r.label);
      });

      // User Marker
      const userG = g.append('g').attr('class', 'user-marker');

      // Pulsing outer ring
      userG
        .append('circle')
        .attr('cx', userXY[0])
        .attr('cy', userXY[1])
        .attr('r', 16)
        .attr('fill', '#a855f7')
        .attr('fill-opacity', 0.25)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '10;22;10')
        .attr('dur', '2.5s')
        .attr('repeatCount', 'indefinite');

      // Center pin dot
      userG
        .append('circle')
        .attr('cx', userXY[0])
        .attr('cy', userXY[1])
        .attr('r', 6)
        .attr('fill', '#a855f7')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      // User Label
      userG
        .append('text')
        .attr('x', userXY[0])
        .attr('y', userXY[1] - 12)
        .attr('text-anchor', 'middle')
        .attr('fill', '#c084fc')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text(`📍 You (${userLoc.name.split(',')[0]})`);
    }

    // 3. Draw Connection Lines from User Location to Worship Places
    const linesGroup = g.append('g').attr('class', 'connection-lines');
    filteredPlaces.forEach((p) => {
      const ptXY = projection([p.lng, p.lat]);
      if (userXY && ptXY) {
        const isJoined = joinedPlaceIds.includes(p.id);
        linesGroup
          .append('line')
          .attr('x1', userXY[0])
          .attr('y1', userXY[1])
          .attr('x2', ptXY[0])
          .attr('y2', ptXY[1])
          .attr('stroke', isJoined ? '#f59e0b' : '#334155')
          .attr('stroke-width', isJoined ? 1.5 : 0.75)
          .attr('stroke-opacity', isJoined ? 0.6 : 0.3)
          .attr('stroke-dasharray', isJoined ? 'none' : '2 2');
      }
    });

    // 4. Draw Worship Place Nodes
    const nodesGroup = g.append('g').attr('class', 'place-nodes');

    filteredPlaces.forEach((p) => {
      const ptXY = projection([p.lng, p.lat]);
      if (!ptXY) return;

      const isJoined = joinedPlaceIds.includes(p.id);
      const isSelected = p.id === selectedPlaceId;
      const colorObj = RELIGION_COLORS[p.religion] || RELIGION_COLORS.Other;

      const nodeG = nodesGroup
        .append('g')
        .attr('class', 'place-node')
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedPlaceId(p.id);
          if (onSelectPlace) onSelectPlace(p);
        })
        .on('mouseenter', (event) => {
          setHoveredPlace({
            place: p,
            x: event.clientX,
            y: event.clientY,
            distanceKm: p.distanceKm,
          });
        })
        .on('mouseleave', () => {
          setHoveredPlace(null);
        });

      // Outer aura for joined or selected
      if (isJoined || isSelected) {
        nodeG
          .append('circle')
          .attr('cx', ptXY[0])
          .attr('cy', ptXY[1])
          .attr('r', isSelected ? 18 : 14)
          .attr('fill', colorObj.hex)
          .attr('fill-opacity', 0.25)
          .attr('stroke', colorObj.hex)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', isJoined ? '3 3' : 'none');
      }

      // Main Node Circle
      nodeG
        .append('circle')
        .attr('cx', ptXY[0])
        .attr('cy', ptXY[1])
        .attr('r', isSelected ? 10 : 8)
        .attr('fill', colorObj.hex)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2);

      // Icon / Joined Star Badge
      if (isJoined) {
        nodeG
          .append('circle')
          .attr('cx', ptXY[0] + 6)
          .attr('cy', ptXY[1] - 6)
          .attr('r', 4)
          .attr('fill', '#f59e0b')
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 1);
      }

      // City / Place Name Label
      nodeG
        .append('text')
        .attr('x', ptXY[0])
        .attr('y', ptXY[1] + (isSelected ? 20 : 18))
        .attr('text-anchor', 'middle')
        .attr('fill', isSelected ? '#ffffff' : '#94a3b8')
        .attr('font-size', isSelected ? '11px' : '9px')
        .attr('font-weight', isSelected || isJoined ? 'bold' : 'normal')
        .attr('font-family', 'sans-serif')
        .text(`${p.name.split(' ')[0]} (${p.city})`);
    });
  }, [filteredPlaces, userLoc, joinedPlaceIds, selectedPlaceId]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            Interactive D3 Spatial Map Grid
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-100 tracking-tight">
            Visual Congregational Map & Proximity Radar
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed">
            Explore places of worship across the spatial coordinate grid relative to your current location. Track distances in real-time, inspect multi-faith congregations, and join centers with a single click.
          </p>
        </div>
      </div>

      {/* MAP CONTROLS & FILTER BAR */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Reference Location Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
              <MapPin className="w-4 h-4 text-indigo-400" /> Reference Point:
            </span>

            {PRESET_USER_LOCATIONS.map((loc) => (
              <button
                key={loc.name}
                onClick={() =>
                  setUserLoc({ lat: loc.lat, lng: loc.lng, name: loc.name })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  userLoc.name === loc.name
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {loc.name.split(',')[0]}
              </button>
            ))}

            <button
              onClick={handleGPSLocate}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1 whitespace-nowrap"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Locating...' : 'GPS'}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search map places, city, country..."
              className="w-full bg-slate-950 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Religion Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs border-t border-slate-800/80 pt-3">
          <span className="text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> Filter Faith:
          </span>

          {['All', 'Islam', 'Christianity', 'Hinduism', 'Judaism', 'Sikhism'].map((rel) => {
            const isSelected = selectedReligion === rel;
            const colorObj = RELIGION_COLORS[rel as Religion] || RELIGION_COLORS.Other;

            return (
              <button
                key={rel}
                onClick={() => setSelectedReligion(rel)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-100 text-slate-950 shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {rel === 'All' ? '🌟 All Religions' : rel}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN D3 CANVAS & SIDEBAR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* D3 MAP CANVAS (2 COLS) */}
        <div
          ref={containerRef}
          className="lg:col-span-2 bg-slate-950 rounded-3xl border border-slate-800 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px]"
        >
          {/* Map Overlay Controls */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-xs text-slate-300">
            <Globe className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            <span className="font-bold text-slate-100">{filteredPlaces.length}</span>
            <span>Places Rendered</span>
          </div>

          {/* D3 SVG Container */}
          <svg
            ref={svgRef}
            className="w-full h-[460px] rounded-2xl cursor-grab active:cursor-grabbing"
          />

          {/* Map Legend */}
          <div className="pt-3 border-t border-slate-900 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Islam
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Christianity
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Hinduism
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Judaism
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Sikhism
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span>Scroll / Pinch to Zoom • Drag to Pan</span>
            </div>
          </div>
        </div>

        {/* SIDEBAR: SELECTED / NEARBY CONGREGATION CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-serif text-slate-100 text-base flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" /> Nearby Congregations
            </h3>
            <span className="text-xs text-slate-400">Sorted by distance</span>
          </div>

          {/* Active Selected Card Detail */}
          {activeSelectedPlace ? (
            <div className="bg-gradient-to-b from-slate-900 to-indigo-950/60 p-5 rounded-2xl border border-indigo-500/40 shadow-xl space-y-4 relative animate-scaleUp">
              <div className="flex items-start gap-3">
                <img
                  src={activeSelectedPlace.imageUrl}
                  alt={activeSelectedPlace.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeSelectedPlace.religion}
                  </span>
                  <h4 className="font-bold text-slate-100 text-sm font-serif leading-tight">
                    {activeSelectedPlace.name}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {activeSelectedPlace.city}, {activeSelectedPlace.country}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Distance from {userLoc.name.split(',')[0]}:</span>
                  <span className="font-bold font-mono text-amber-300">
                    {activeSelectedPlace.distanceKm.toLocaleString()} km
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Congregation Day:</span>
                  <span className="font-bold text-slate-200">
                    {activeSelectedPlace.congregationDay}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Leader:</span>
                  <span className="font-medium text-slate-300">
                    {activeSelectedPlace.preacherTitle} {activeSelectedPlace.preacherName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onToggleJoin(activeSelectedPlace.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    joinedPlaceIds.includes(activeSelectedPlace.id)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
                  }`}
                >
                  {joinedPlaceIds.includes(activeSelectedPlace.id) ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Joined Place
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" /> Join Congregation
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center space-y-1">
              <Info className="w-4 h-4 text-indigo-400 mx-auto" />
              <p>Click any node pin on the D3 map to view congregation details.</p>
            </div>
          )}

          {/* List of Nearby Places */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 no-scrollbar">
            {filteredPlaces.map((place) => {
              const isJoined = joinedPlaceIds.includes(place.id);
              const isSelected = place.id === selectedPlaceId;

              return (
                <div
                  key={place.id}
                  onClick={() => setSelectedPlaceId(place.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/50 shadow'
                      : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-200 truncate">
                        {place.name}
                      </span>
                      {isJoined && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {place.religion} • {place.city}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {place.distanceKm.toLocaleString()} km
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
