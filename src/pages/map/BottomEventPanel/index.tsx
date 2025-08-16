import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCog, faMapMarkerAlt, faTachometerAlt, faTimes, faTruck } from '@fortawesome/free-solid-svg-icons';
import EventPosition from './EventPosition';
import { convertFuelRawToLiters, filterEventsLast4Hours } from '../utils/events';
import { formatDate, getTimeRangeText } from '../utils/format';

interface Props {
  selectedVehicle: any;
  events: any[];
  loading: boolean;
  onClose: () => void;
  panelHeight: number;
  onMouseDownResize: (e: React.MouseEvent) => void;
  sensorMap: Record<string, string>;
  isLoaded: boolean;
}

export default function BottomEventPanel({ selectedVehicle, events, loading, onClose, panelHeight, onMouseDownResize, sensorMap, isLoaded }: Props) {
  const filtered = filterEventsLast4Hours(events);

  return (
    <div className="bottom-event-panel" style={{ height: `${panelHeight}%` }}>
      <div className="resize-handle" onMouseDown={onMouseDownResize} />

      <div className="bottom-panel-header">
        <div className="vehicle-info-header">
          <div className={`status-circle status-${selectedVehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
            <FontAwesomeIcon icon={faTruck} style={{ color: 'white', fontSize: 16 }} />
          </div>
          <div>
            <h3>{selectedVehicle.registration}</h3>
            <span className={`status-badge status-${selectedVehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>{selectedVehicle.statusClassName}</span>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="bottom-panel-content">
        {loading ? (
          <div className="loading-container">
            <span className="spinner" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        ) : filtered.length > 0 ? (
          <div className="events-list">
            <h4>
              Events (แสดงข้อมูลย้อนหลัง 4 ชั่วโมง - {filtered.length} เหตุการณ์) - เรียงจากล่าสุด
            </h4>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>ช่วงเวลา: {getTimeRangeText()}</p>
            <div className="detailed-events-list">
              {filtered.map((event, index) => {
                const lat = event.lat || event.coords?.lat || event.latitude;
                const lng = event.lng || event.coords?.lng || event.longitude;
                const sensorEntries = Object.entries(event.sensors || {})
                  .filter(([num]) => {
                    const name = (sensorMap[num] || num).toLowerCase();
                    return !name.includes('altitude') && name !== 'altitude' && !name.includes('alt');
                  }) as [string, any][];

                return (
                  <div key={`${event.date || event.event_ts}-${lat}-${lng}-${index}`} className="detailed-event-item">
                    <div className="event-header">
                      <div className="event-time-detailed">
                        <FontAwesomeIcon icon={faClock} />
                        <strong>เวลา:</strong> {formatDate(event.date || event.event_ts)}
                      </div>
                      {event.vehicleStatus && (
                        <span className={`event-status-badge status-${event.vehicleStatus?.toLowerCase().replace(/\s+/g, '-')}`}>{event.vehicleStatus}</span>
                      )}
                    </div>

                    <div className="event-content">
                      <div className="event-main-info">
                        <div className="event-row">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          <div className="event-info">
                            <strong>ตำแหน่ง : </strong>
                            <EventPosition event={event} isLoaded={isLoaded} />
                          </div>
                        </div>

                        {event.speed !== undefined && (
                          <div className="event-row">
                            <FontAwesomeIcon icon={faTachometerAlt} />
                            <div className="event-info">
                              <strong>ความเร็ว</strong>
                              <span>{event.speed} กม./ชม.</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {!!sensorEntries.length && (
                        <div className="event-row sensors-row">
                          <div>
                            <FontAwesomeIcon icon={faCog} />
                            <strong>เซ็นเซอร์ : </strong>
                          </div>
                          <div className="sensors-data">
                            {sensorEntries.map(([sensorNumber, value]) => {
                              const sensorName = sensorMap[sensorNumber] || sensorNumber;
                              let displayValue: any = value;
                              if (sensorName === 'FUEL CAPACITY') displayValue = `${convertFuelRawToLiters(Number(value)).toFixed(2)} L`;
                              else if (sensorName.toLowerCase().includes('temp')) displayValue = `${value} องศา`;
                              else if (sensorName.toLowerCase().includes('speed')) displayValue = `${value} กม./ชม.`;
                              else if (sensorName.toLowerCase().includes('voltage') || sensorName.toLowerCase().includes('volt')) displayValue = `${value} โวลต์`;
                              else if (sensorName.toLowerCase().includes('battery')) displayValue = `${value}%`;

                              return (
                                <div key={sensorNumber} className="sensor-item">
                                  <strong>{sensorName}:</strong> {String(displayValue)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-events">
            <p>ไม่พบข้อมูลกิจกรรมสำหรับช่วง 4 ชั่วโมงที่ผ่านมา</p>
          </div>
        )}
      </div>
    </div>
  );
}
