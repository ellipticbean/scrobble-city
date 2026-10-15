
import { useState } from 'react';

interface UsernameFormProps {
  onSubmit: (username: string) => void;
  onDemo: () => void;
  loading: boolean;
}

export default function UsernameForm({
  onSubmit,
  onDemo,
  loading,
}: UsernameFormProps) {
  const [username, setUsername] = useState(() => new URLSearchParams(window.location.search).get('user')?.slice(0, 100) || '');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedUsername = username.trim();

    if (!cleanedUsername) return;

    onSubmit(cleanedUsername);
  }

  return (
    <form className="username-form" onSubmit={handleSubmit}>
      <label htmlFor="lastfm-username">
        ♪ ENTER YOUR LAST.FM USERNAME ♪
      </label>

      <div className="username-input-row">
        <input
          id="lastfm-username"
          type="text"
          maxLength={100}
          autoComplete="username"
          spellCheck={false}
          placeholder="Your Last.fm username..."
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={loading}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? '🏗️ Building...' : '🏡 Build My City!'}
        </button>
      </div>

      <button
        type="button"
        className="demo-button"
        onClick={onDemo}
        disabled={loading}
      >
        Or explore a demo city →
      </button>
    </form>
  );
}
