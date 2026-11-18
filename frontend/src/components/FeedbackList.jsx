import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { formatDate } from '../eventUtils';
import ImageViewer from './ImageViewer';
import './Feedback.css';

// Photos on a feedback entry (older entries stored a single `image`)
const attachmentsOf = (f) => (f.images && f.images.length ? f.images : (f.image ? [f.image] : []));

// Read-only view of feedback received by the logged-in user's committee.
function FeedbackList() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('all');
  const [viewer, setViewer] = useState(null); // { images, index }

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_BASE}/api/feedback`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFeedback(res.data))
      .catch(err => console.error('Error fetching feedback', err))
      .finally(() => setLoading(false));
  }, []);

  // Distinct events that have feedback
  const eventOptions = useMemo(() => {
    const seen = new Map();
    feedback.forEach(f => { if (f.event) seen.set(f.event._id, f.event.name); });
    return [...seen.entries()];
  }, [feedback]);

  const visible = eventFilter === 'all'
    ? feedback
    : feedback.filter(f => f.event?._id === eventFilter);

  const average = visible.length
    ? (visible.reduce((sum, f) => sum + f.rating, 0) / visible.length).toFixed(1)
    : null;

  if (loading) return <p>Loading feedback...</p>;

  return (
    <div className="fbx-list">
      <div className="fbx-list-top">
        <div className="fbx-summary">
          <div><span className="fbx-big">{visible.length}</span><span>Responses</span></div>
          <div><span className="fbx-big">{average ?? '–'}</span><span>Average rating</span></div>
        </div>
        {eventOptions.length > 0 && (
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="fbx-filter">
            <option value="all">All events</option>
            {eventOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
      </div>

      {visible.length === 0 && <p className="fbx-hint">No feedback received yet.</p>}

      <div className="fbx-feedback-items">
        {visible.map(f => (
          <div className="fbx-feedback-item" key={f._id}>
            <div className="fbx-feedback-head">
              <strong>{f.name}</strong>
              <span className="fbx-stars-static" aria-label={`${f.rating} out of 5`}>
                {'★'.repeat(f.rating)}<span className="dim">{'★'.repeat(5 - f.rating)}</span>
              </span>
            </div>
            <div className="fbx-feedback-meta">
              {f.email} · {f.event?.name || 'Deleted event'} · {formatDate(f.createdAt?.slice(0, 10))}
            </div>
            {f.comments && <p className="fbx-feedback-comment">{f.comments}</p>}
            {attachmentsOf(f).length > 0 && (
              <button
                type="button"
                className="fbx-attachment-link"
                onClick={() => setViewer({ images: attachmentsOf(f), index: 0 })}
              >
                {attachmentsOf(f).length === 1
                  ? 'View attachment'
                  : `View attachments (${attachmentsOf(f).length})`}
              </button>
            )}
          </div>
        ))}
      </div>

      {viewer && (
        <ImageViewer images={viewer.images} startIndex={viewer.index} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}

export default FeedbackList;
