import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { committees } from '../committees';
import { API_BASE } from '../api';
import { isVjtiEmail, formatDateRange, formatTime, imageToDataUrl } from '../eventUtils';
import '../components/Feedback.css';

const MAX_PHOTOS = 5;

function Feedback() {
  const [searchParams] = useSearchParams();
  const [committeeId, setCommitteeId] = useState(searchParams.get('committee') || '');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventId, setEventId] = useState('');
  const initialEventId = useRef(searchParams.get('event'));
  const [event, setEvent] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [images, setImages] = useState([]);
  const [imageKey, setImageKey] = useState(0); // remounts the file input to clear it

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Load events when a committee is chosen
  useEffect(() => {
    setEvents([]); setEventId(''); setEvent(null);
    if (!committeeId) return;
    setEventsLoading(true);
    axios.get(`${API_BASE}/api/events`, { params: { committee: committeeId } })
      .then(res => {
        setEvents(res.data);
        // Preselect the event when arriving from the homepage grid
        const wanted = initialEventId.current;
        initialEventId.current = null;
        if (wanted && res.data.some(ev => ev._id === wanted)) setEventId(wanted);
      })
      .catch(err => console.error(err))
      .finally(() => setEventsLoading(false));
  }, [committeeId]);

  // Load the full event (with poster) when one is chosen
  useEffect(() => {
    setEvent(null);
    if (!eventId) return;
    axios.get(`${API_BASE}/api/events/${eventId}`)
      .then(res => setEvent(res.data))
      .catch(err => console.error(err));
  }, [eventId]);

  const emailInvalid = emailTouched && email.trim() !== '' && !isVjtiEmail(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isVjtiEmail(email)) { setEmailTouched(true); return; }
    if (rating === 0) { setError('Please choose a rating.'); return; }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/feedback`, {
        eventId, name, email, rating, comments, images,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false); setEventId(''); setEvent(null);
    setName(''); setEmail(''); setEmailTouched(false); setRating(0); setComments(''); setImages([]);
  };

  const handleImages = async (e) => {
    const files = [...e.target.files];
    if (files.length === 0) return;
    setError('');
    const room = MAX_PHOTOS - images.length;
    if (files.length > room) setError(`You can attach up to ${MAX_PHOTOS} photos.`);
    try {
      const added = await Promise.all(files.slice(0, room).map(f => imageToDataUrl(f, 1000)));
      setImages(prev => [...prev, ...added]);
    } catch (err) {
      setError(err.message);
    }
    setImageKey(k => k + 1); // clear the file input so the same file can be re-picked
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (done) {
    return (
      <div className="page-container">
        <div className="card fbx-thanks" data-aos="fade-up">
          <div className="fbx-thanks-icon">✓</div>
          <h2>Thank you for your feedback!</h2>
          <p>Your response has been shared with the committee.</p>
          <button className="btn btn-primary" onClick={reset}>Give feedback for another event</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" data-aos="fade-down">
        <h1>Event Feedback</h1>
        <p>Attended a recent event? Tell the committee how it went. No login needed.</p>
      </div>

      <div className="card fbx-card" data-aos="fade-up">
        <div className="fbx-row">
          <div className="fbx-group">
            <label htmlFor="committee">1. Committee</label>
            <select id="committee" value={committeeId} onChange={(e) => setCommitteeId(e.target.value)}>
              <option value="">Select a committee</option>
              {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="fbx-group">
            <label htmlFor="event">2. Event</label>
            <select
              id="event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={!committeeId || eventsLoading}
            >
              <option value="">
                {!committeeId ? 'Select a committee first'
                  : eventsLoading ? 'Loading events...'
                  : events.length === 0 ? 'No events posted yet'
                  : 'Select an event'}
              </option>
              {events.map(ev => (
                <option key={ev._id} value={ev._id}>{ev.name} ({formatDateRange(ev.date, ev.endDate)})</option>
              ))}
            </select>
          </div>
        </div>

        {event && (
          <div className="fbx-event">
            {event.poster && <img src={event.poster} alt={`${event.name} poster`} className="fbx-event-poster" />}
            <div className="fbx-event-info">
              <h3>{event.name}</h3>
              <p><strong>{event.endDate ? 'Dates' : 'Date'}:</strong> {formatDateRange(event.date, event.endDate)}</p>
              <p><strong>Time:</strong> {formatTime(event.startTime)} – {formatTime(event.endTime)}</p>
              {event.description && <p className="fbx-event-desc">{event.description}</p>}
            </div>
          </div>
        )}

        {event && (
          <form onSubmit={handleSubmit} className="fbx-form">
            <h3 className="fbx-form-title">3. Your feedback</h3>

            <div className="fbx-row">
              <div className="fbx-group">
                <label htmlFor="name">Full name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
              </div>
              <div className="fbx-group">
                <label htmlFor="email">College email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  className={emailInvalid ? 'invalid' : ''}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="yourname@branch.vjti.ac.in"
                  required
                />
                {emailInvalid && <span className="fbx-field-error">Invalid email. It must end with .vjti.ac.in</span>}
              </div>
            </div>

            <div className="fbx-group">
              <label>Rating</label>
              <div className="fbx-stars" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    type="button"
                    key={n}
                    className={n <= rating ? 'star on' : 'star'}
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >★</button>
                ))}
              </div>
            </div>

            <div className="fbx-group">
              <label htmlFor="comments">Comments (optional)</label>
              <textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="What went well? What could be better?" rows={4} />
            </div>

            <div className="fbx-group">
              <label htmlFor="attachment">Attach photos (optional, up to {MAX_PHOTOS})</label>
              <input
                key={imageKey}
                id="attachment"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImages}
                disabled={images.length >= MAX_PHOTOS}
              />
              <span className="fbx-hint-inline">Handy if you have a complaint or want to show an issue.</span>
              {images.length > 0 && (
                <div className="fbx-attach-previews">
                  {images.map((src, i) => (
                    <div className="fbx-attach-item" key={i}>
                      <img src={src} alt={`Attachment ${i + 1}`} />
                      <button type="button" className="fbx-attach-remove" onClick={() => removeImage(i)} aria-label="Remove photo">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="fbx-error">{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Feedback;
