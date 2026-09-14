import { useState, useEffect } from 'react';

export default function ServerWarmupBanner() {
  // 'checking' | 'waking' | 'ready' | 'hidden'
  const [status, setStatus] = useState('checking');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timerInterval = null;

    // Trigger timer if waking takes longer than 1.5s
    const slowTimer = setTimeout(() => {
      if (isMounted && status !== 'ready') {
        setStatus('waking');
        timerInterval = setInterval(() => {
          setSeconds(s => s + 1);
        }, 1000);
      }
    }, 1200);

    // Warm-up ping to /api/health
    fetch('/api/health')
      .then(res => {
        if (res.ok) {
          
          clearTimeout(slowTimer);
          if (timerInterval) clearInterval(timerInterval);
          if (isMounted) {
            setStatus('ready');
            // Auto hide after 3.5 seconds
            setTimeout(() => {
              if (isMounted) setStatus('hidden');
            }, 3500);
          }
        }
      })
      .catch(() => {
        // If initial ping fails, retry once after 5s
        setTimeout(() => {
          fetch('/api/health')
            .then(res => {
              if (res.ok && isMounted) {
                if (timerInterval) clearInterval(timerInterval);
                setStatus('ready');
                setTimeout(() => {
                  if (isMounted) setStatus('hidden');
                }, 3500);
              }
            })
            .catch(() => {});
        }, 5000);
      });

    return () => {
      isMounted = false;
      clearTimeout(slowTimer);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  if (status === 'checking' || status === 'hidden') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 420,
        background: status === 'ready' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(18, 18, 30, 0.92)',
        border: `1px solid ${status === 'ready' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(91, 141, 238, 0.35)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '14px 18px',
        boxShadow: status === 'ready' 
          ? '0 10px 30px rgba(16, 185, 129, 0.2)' 
          : '0 10px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(91, 141, 238, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        animation: 'fadeSlideUp 0.35s ease forwards',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Icon with pulsing indicator */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: status === 'ready' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(91, 141, 238, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {status === 'ready' ? '🟢' : '⚡'}
        </div>
        {status === 'waking' && (
          <span
            style={{
              position: 'absolute',
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid rgba(91, 141, 238, 0.5)',
              animation: 'pulse-ring 1.8s infinite ease-out',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: status === 'ready' ? '#10d98f' : '#f1f5f9' }}>
            {status === 'ready' ? 'Cloud AI Engine Online' : 'Waking Up Cloud Server'}
          </span>
          {status === 'waking' && (
            <span style={{ fontSize: 11, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
              {seconds}s
            </span>
          )}
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: status === 'ready' ? '#94a3b8' : '#cbd5e1', lineHeight: 1.35 }}>
          {status === 'ready'
            ? 'Backend connected and ready for resume analysis.'
            : 'Render free tier spins down after inactivity. Powering on (~20–30s on first load)...'}
        </p>

        {/* Shimmer Progress bar when waking */}
        {status === 'waking' && (
          <div
            style={{
              marginTop: 8,
              height: 4,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '60%',
                height: '100%',
                background: 'linear-gradient(90deg, #5b8dee, #8b5cf6, #5b8dee)',
                borderRadius: 4,
                animation: 'shimmer 1.5s infinite linear',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
