import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { formatDateRange, formatTime, imageToDataUrl } from '../eventUtils';
import TimePicker from './TimePicker';
import './Feedback.css';

// Student treasurer: post details of a finished event so people can give feedback.
function EventManager({ committee }) {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const loadEvents = useCallback(async () => {
    if (!committee) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/events`, {
        params: { committee, withPoster: 1 },
      });
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events', err);
    }
  }, [committee]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handlePoster = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    try {
      setPoster(await imageToDataUrl(file));
    } catch (err) {
      setPoster('');
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await axios.post(
        `${API_BASE}/api/events`,
        { name, date, endDate, startTime, endTime, description, poster },
        authConfig()
      );
      setSuccess('Event posted. It is now available on the feedback page.');
      setName(''); setDate(''); setEndDate(''); setStartTime(''); setEndTime(''); setDescription(''); setPoster('');
      e.target.reset();
      loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post the event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API_BASE}/api/events/${id}`, authConfig());
      loadEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete the event.');
    }
  };

  return (
    <div className="fbx-manager">
      <form onSubmit={handleSubmit} className="fbx-form">
        <h3 className="fbx-form-title">Post a completed event</h3>
        <p className="fbx-hint">Add this after the event takes place. Attendees will pick it from the feedback page.</p>

        <div className="fbx-group">
          <label htmlFor="ev-name">Event name</label>
          <input id="ev-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Robo Wars 2026" required />
        </div>

        <div className="fbx-row">
          <div className="fbx-group">
            <label htmlFor="ev-date">From date</label>
            <input
              id="ev-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (endDate && endDate < e.target.value) setEndDate('');
              }}
              required
            />
          </div>
          <div className="fbx-group">
            <label htmlFor="ev-end-date">To date (if multi-day)</label>
            <input
              id="ev-end-date"
              type="date"
              value={endDate}
              min={date || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="fbx-row">
          <div className="fbx-group">
            <label htmlFor="ev-start">Start time</label>
            <TimePicker id="ev-start" value={startTime} onChange={setStartTime} required />
          </div>
          <div className="fbx-group">
            <label htmlFor="ev-end">End time</label>
            <TimePicker id="ev-end" value={endTime} onChange={setEndTime} required />
          </div>
        </div>

        <div className="fbx-group">
          <label htmlFor="ev-desc">Short description (optional)</label>
          <textarea id="ev-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One or two lines about the event" />
        </div>

        <div className="fbx-group">
          <label htmlFor="ev-poster">Event poster</label>
          <input id="ev-poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePoster} />
          {poster && <img src={poster} alt="Poster preview" className="fbx-poster-preview" />}
        </div>

        {success && <div className="fbx-success">{success}</div>}
        {error && <div className="fbx-error">{error}</div>}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
          {saving ? 'Posting...' : 'Post Event'}
        </button>
      </form>

      <h3 className="fbx-form-title" style={{ marginTop: '2rem' }}>Your posted events</h3>
      {events.length === 0 && <p className="fbx-hint">No events posted yet.</p>}
      <div className="fbx-event-list">
        {events.map(ev => (
          <div className="fbx-event-item" key={ev._id}>
            {ev.poster
              ? <img src={ev.poster} alt="" className="fbx-thumb" />
              : <div className="fbx-thumb empty">No poster</div>}
            <div className="fbx-event-item-info">
              <strong>{ev.name}</strong>
              <span>{formatDateRange(ev.date, ev.endDate)} · {formatTime(ev.startTime)} – {formatTime(ev.endTime)}</span>
            </div>
            <button type="button" className="fbx-delete" onClick={() => handleDelete(ev._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventManager;
