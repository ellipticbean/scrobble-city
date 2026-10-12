
import { useState, type CSSProperties, type FormEvent } from 'react';

import {
    getMusicCompatibility,
    type MusicCompatibilityReport,
} from '../lib/musicCompatibility';

import CompatibilityCertificate from './CompatibilityCertificate';

import type { LastFmPeriod } from '../types/lastfm';

/* =========================================
   SCROBBLE CITY
   TWO-LISTENER COMPATIBILITY
========================================= */

interface MusicCompatibilityPanelProps {
    username: string;
    disabled?: boolean;
    onComparisonSuccess?: (score: number) => void;
}

const periods: {
    value: LastFmPeriod;
    label: string;
}[] = [
        { value: 'overall', label: 'All Time' },
        { value: '12month', label: 'Last 12 Months' },
        { value: '6month', label: 'Last 6 Months' },
        { value: '3month', label: 'Last 3 Months' },
        { value: '1month', label: 'Last Month' },
        { value: '7day', label: 'Last 7 Days' },
    ];

function getRelationshipMessage(
    report: MusicCompatibilityReport
): string {
    if (report.score >= 80) {
        return (
            'The Matchmaking Agency suspects you may be ' +
            'sharing a brain, a playlist, or an extremely ' +
            'specific musical upbringing.'
        );
    }

    if (report.score >= 55) {
        return (
            'Your headphones appear to be speaking the ' +
            'same language. The Department recommends ' +
            'a shared playlist immediately.'
        );
    }

    if (report.score >= 30) {
        return (
            'You have enough musical common ground ' +
            'to survive a road trip together. ' +
            'The aux cord negotiations may get interesting.'
        );
    }

    if (report.score >= 10) {
        return (
            'You occupy different musical neighborhoods, ' +
            'but a few bridges connect them. ' +
            'A collaborative playlist is advised.'
        );
    }

    return (
        'Your record collections appear to have ' +
        'been raised on different planets. ' +
        'Fortunately, discovering new music is free.'
    );
}

export default function MusicCompatibilityPanel({
    username,
    disabled = false,
    onComparisonSuccess,
}: MusicCompatibilityPanelProps) {
    const [otherUsername, setOtherUsername] = useState('');
    const [period, setPeriod] =
        useState<LastFmPeriod>('overall');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [report, setReport] =
        useState<MusicCompatibilityReport | null>(null);

    const [showAllShared, setShowAllShared] =
        useState(false);

    const [copied, setCopied] = useState(false);

    function clearPreviousResult() {
        setReport(null);
        setError('');
        setCopied(false);
        setShowAllShared(false);
    }

    async function handleCompare(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (loading || disabled) return;

        setError('');
        setReport(null);
        setCopied(false);
        setLoading(true);

        try {
            const result = await getMusicCompatibility(
                username,
                otherUsername,
                period
            );

            setReport(result);
            setShowAllShared(false);
            // Unlock achievements only when a real cross-account comparison succeeds.
            // Comparing a username against itself remains valid for the report,
            // but is not a two-listener achievement.
            if (result.firstUsername.trim().toLocaleLowerCase('en-US') !==
                result.secondUsername.trim().toLocaleLowerCase('en-US')) {
                onComparisonSuccess?.(result.score);
            }

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong comparing music.'
            );

        } finally {
            setLoading(false);
        }
    }

    async function copyCompatibility() {
        if (!report) return;

        const sharedNames = report.sharedArtists
            .slice(0, 10)
            .map((artist) => artist.name)
            .join(', ');

        const text = [
            '💌 SCROBBLE CITY COMPATIBILITY REPORT',
            '',
            `${report.firstUsername} ♡ ${report.secondUsername}`,
            `Listening period: ${periods.find((p) => p.value === report.period)?.label
            }`,
            '',
            `Musical similarity: ${report.score}%`,
            `Official verdict: ${report.verdict}`,
            '',
            getRelationshipMessage(report),
            '',
            `Shared top-100 artists: ${report.sharedCount}`,
            `Shared favorites: ${sharedNames || 'None found'}`,
            '',
            'Made in Scrobble City ♪',
        ].join('\n');

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

        } catch {
            setError(
                'Could not copy the report. ' +
                'Please check your clipboard permissions.'
            );
        }
    }

    const visibleShared = report
        ? showAllShared
            ? report.sharedArtists
            : report.sharedArtists.slice(0, 12)
        : [];

    return (
        <div className="compatibility-panel">

            {/* MATCHMAKING INTRODUCTION */}

            <div className="compat-intro">
                <span>♡ THE HEART-TO-HEART DEPARTMENT ♡</span>

                <h3>Are Your Playlists Meant to Be?</h3>

                <p>
                    Two listeners. Two musical worlds.
                    One extremely nosy matchmaking agency.
                </p>
            </div>

            {/* COMPARISON FORM */}

            <form
                className="compat-form"
                onSubmit={(event) => {
                    void handleCompare(event);
                }}
            >
                <div className="compat-user-fields">
                    <label>
                        YOUR LAST.FM USERNAME
                        <input
                            type="text"
                            value={username}
                            readOnly
                            aria-label="Your Last.fm username"
                        />
                    </label>

                    <div className="compat-middle-heart">
                        ♥
                    </div>

                    <label>
                        THEIR LAST.FM USERNAME
                        <input
                            type="text"
                            value={otherUsername}
                            placeholder="Enter their username..."
                            onChange={(event) => {
                                setOtherUsername(event.target.value);
                                clearPreviousResult();
                            }}
                            disabled={loading || disabled}
                            required
                            maxLength={100}
                        />
                    </label>
                </div>

                <label className="compat-period-label">
                    COMPARE LISTENING PERIOD

                    <select
                        value={period}
                        disabled={loading || disabled}
                        onChange={(event) => {
                            setPeriod(event.target.value as LastFmPeriod);
                            clearPreviousResult();
                        }}
                    >
                        {periods.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <p className="compat-small-note">
                    Both accounts will be compared over the
                    same selected period using up to
                    100 favorite artists per listener.
                </p>

                <button
                    type="submit"
                    className="compat-submit"
                    disabled={loading || disabled}
                >
                    {loading
                        ? '⏳ CONSULTING CUPID...'
                        : '💘 CALCULATE OUR CHEMISTRY →'}
                </button>
            </form>

            {disabled && (
                <div className="compat-notice">
                    Comparison requires a real Last.fm account.
                    Build your own city first to use this feature.
                </div>
            )}

            {loading && (
                <div
                    className="compat-loading"
                    role="status"
                    aria-live="polite"
                >
                    <span>💌</span>
                    <strong>Reviewing your musical chemistry...</strong>
                    <p>
                        Retrieving both listeners' favorite artists
                        from Last.fm.
                    </p>
                </div>
            )}

            {error && (
                <div className="compat-error" role="alert">
                    ⚠️ {error}
                </div>
            )}

            {/* COMPATIBILITY REPORT */}

            {report && (
                <div className="compat-report">

                    <div className="compat-report-heading">
                        <span>OFFICIAL MATCHMAKING FINDINGS</span>

                        <h3>
                            {report.firstUsername}
                            <span> ♥ </span>
                            {report.secondUsername}
                        </h3>
                    </div>

                    {/* SCORE */}

                    <div className="compat-score-section">
                        <div
                            className="compat-score-ring"
                            style={{
                                '--match-score': `${report.score}%`,
                            } as CSSProperties}
                            aria-label={`Musical similarity ${report.score} percent`}
                        >
                            <div className="compat-score-inner">
                                <strong>{report.score}%</strong>
                                <span>SIMILARITY</span>
                            </div>
                        </div>

                        <h3>{report.verdict}</h3>

                        <p>{getRelationshipMessage(report)}</p>
                    </div>

                    {/* GENERAL STATISTICS */}

                    <div className="compat-stats">
                        <div>
                            <span>💞 SHARED ARTISTS</span>
                            <strong>{report.sharedCount}</strong>
                        </div>

                        <div>
                            <span>🎧 YOUR ARTISTS</span>
                            <strong>{report.firstArtistCount}</strong>
                        </div>

                        <div>
                            <span>🎵 THEIR ARTISTS</span>
                            <strong>{report.secondArtistCount}</strong>
                        </div>
                    </div>

                    {/* SHARED FAVORITES */}

                    <section className="compat-section">
                        <h4>💖 Your Shared Musical Obsessions</h4>

                        <p>
                            Artists found in both of your top-100 charts.
                            Lower rank numbers mean bigger favorites.
                        </p>

                        {report.sharedArtists.length === 0 ? (
                            <div className="compat-empty">
                                No overlapping artists were found in the
                                selected top-100 charts. The Matchmaking
                                Agency recommends exchanging playlists.
                            </div>
                        ) : (
                            <>
                                <div className="compat-shared-list">
                                    {visibleShared.map((artist, index) => (
                                        <div
                                            className="compat-shared-item"
                                            key={artist.name}
                                        >
                                            <span className="compat-shared-number">
                                                {index + 1}
                                            </span>

                                            <strong>{artist.name}</strong>

                                            <small>
                                                #{artist.firstRank} for you
                                                {' · '}
                                                #{artist.secondRank} for them
                                            </small>
                                        </div>
                                    ))}
                                </div>

                                {report.sharedArtists.length > 12 && (
                                    <button
                                        type="button"
                                        className="compat-more-button"
                                        onClick={() =>
                                            setShowAllShared(!showAllShared)
                                        }
                                    >
                                        {showAllShared
                                            ? '↑ SHOW FEWER'
                                            : `↓ VIEW ALL ${report.sharedCount} SHARED ARTISTS`}
                                    </button>
                                )}
                            </>
                        )}
                    </section>

                    {/* MUSICAL DIFFERENCES */}

                    <div className="compat-differences">
                        <section>
                            <h4>🌷 Your Musical Territory</h4>

                            <p>
                                Artists in your top 100 but not theirs.
                            </p>

                            {report.firstOnly.length === 0 ? (
                                <p>No exclusive favorites found.</p>
                            ) : (
                                <ol>
                                    {report.firstOnly.slice(0, 8).map((artist) => (
                                        <li key={artist.name}>
                                            <strong>{artist.name}</strong>
                                            <small>#{artist.rank}</small>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>

                        <section>
                            <h4>🌙 Their Musical Territory</h4>

                            <p>
                                Artists in their top 100 but not yours.
                            </p>

                            {report.secondOnly.length === 0 ? (
                                <p>No exclusive favorites found.</p>
                            ) : (
                                <ol>
                                    {report.secondOnly.slice(0, 8).map((artist) => (
                                        <li key={artist.name}>
                                            <strong>{artist.name}</strong>
                                            <small>#{artist.rank}</small>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </div>

                    {/* FINAL VERDICT */}

                    <div className="compat-final-verdict">
                        <span>💌 OFFICIAL ROMANTIC SPECULATION 💌</span>
                        <strong>{report.verdict}</strong>
                        <p>
                            Certified by the Scrobble City
                            Matchmaking Agency.
                        </p>
                    </div>

                    {/* Shareable pixel-art certificate */}
                    <CompatibilityCertificate report={report} />

                    <button
                        type="button"
                        className="compat-copy-button"
                        onClick={() => {
                            void copyCompatibility();
                        }}
                    >
                        {copied
                            ? '✓ COMPATIBILITY REPORT COPIED!'
                            : '💌 COPY OUR COMPATIBILITY REPORT'}
                    </button>

                    <p className="compat-disclaimer">
                        This is a playful music-similarity score
                        based on ranked artist overlap, not a
                        scientific relationship assessment.
                        Artists outside either top-100 list are
                        not included in this comparison.
                    </p>
                </div>
            )}
        </div>
    );
}
