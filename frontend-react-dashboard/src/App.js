
import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    // Fetch dashboard statistics from the backend
    useEffect(() => {
        fetch(`${API}/api/stats`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard data.");
                }

                return response.json();
            })
            .then((data) => {
                setStats(data);
            })
            .catch(() => {
                setError(
                    "Unable to load data. Make sure the backend is running on port 5000."
                );
            });
    }, []);

    // Summary cards
    const summaryCards = stats
        ? [
              {
                  icon: "📍",
                  label: "Public reports",
                  value: stats.total,
              },
              {
                  icon: "🕒",
                  label: "Pending review",
                  value: stats.pending,
              },
              {
                  icon: "🛠️",
                  label: "In progress",
                  value: stats.inProgress,
              },
              {
                  icon: "✅",
                  label: "Resolved",
                  value: stats.resolved,
              },
          ]
        : [];

    const categories = stats?.byCategory || [];
    const recentReports = stats?.recent || [];

    const largestCategoryCount = Math.max(
        1,
        ...categories.map((item) => Number(item.count))
    );

    return (
        <div className="site-shell">
            {/* Navigation header */}
            <header className="site-header">
                <div className="header-inner">
                    <a
                        className="brand"
                        href="http://localhost:5000/index.html"
                    >
                        <span className="brand-mark">🌿</span>

                        <span className="brand-copy">
                            <strong>EcoMap</strong>
                            <small>Cleaner communities, together</small>
                        </span>
                    </a>

                    <nav
                        className="main-nav"
                        aria-label="Main navigation"
                    >
                        <a href="http://localhost:5000/index.html">
                            Home
                        </a>

                        <a href="http://localhost:5000/map.html">
                            Explore map
                        </a>

                        <a href="http://localhost:5000/report.html">
                            Report an issue
                        </a>

                        <a className="active" href="http://localhost:3000">
                            Dashboard
                        </a>

                        <a href="http://localhost:5000/about.html">
                            About
                        </a>

                        <a href="http://localhost:5000/my-reports.html">
                            My reports
                        </a>
                        <a href="http://localhost:5000/login.html">
    Login / Register
</a>

                        <a
                            className="admin-link"
                            href="http://localhost:5000/admin-login.html"
                        >
                            Admin
                        </a>
                    </nav>
                </div>
            </header>

            {/* Dashboard content */}
            <main className="page-content">
                <section className="page-heading">
                    <p className="eyebrow">
                        COMMUNITY · ENVIRONMENT · ACTION
                    </p>

                    <h1>
                        Environmental dashboard<span>.</span>
                    </h1>

                    <p className="page-description">
                        See the environmental issues your community has
                        reported and track progress toward a cleaner place
                        to live.
                    </p>
                </section>

                {/* Loading and error messages */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!stats && !error && (
                    <div className="loading-message">
                        Loading community statistics...
                    </div>
                )}

                {stats && (
                    <>
                        {/* Summary statistics */}
                        <section
                            className="summary-grid"
                            aria-label="Report summary"
                        >
                            {summaryCards.map((card) => (
                                <article
                                    className="summary-card"
                                    key={card.label}
                                >
                                    <span className="summary-icon">
                                        {card.icon}
                                    </span>

                                    <div className="summary-copy">
                                        <span>{card.label}</span>
                                        <strong>{card.value ?? 0}</strong>
                                    </div>
                                </article>
                            ))}
                        </section>

                        {/* Reports overview */}
                        <section className="dashboard-section">
                            <div className="section-heading">
                                <div>
                                    <p className="eyebrow">TAKE A LOOK</p>

                                    <h2>
                                        Community report overview
                                    </h2>

                                    <p>
                                        Explore the types of issues being
                                        reported.
                                    </p>
                                </div>

                                <a
                                    className="text-link"
                                    href="http://localhost:5000/map.html"
                                >
                                    Explore the map →
                                </a>
                            </div>

                            <div className="dashboard-grid">
                                {/* Reports by category */}
                                <article className="content-card">
                                    <h3>Reports by category</h3>

                                    {categories.length > 0 ? (
                                        categories.map((item) => {
                                            const barWidth = Math.max(
                                                2,
                                                (Number(item.count) /
                                                    largestCategoryCount) *
                                                    100
                                            );

                                            return (
                                                <div
                                                    className="category-row"
                                                    key={item.category}
                                                >
                                                    <span className="category-name">
                                                        {item.category}
                                                    </span>

                                                    <div className="bar-track">
                                                        <div
                                                            className="bar-fill"
                                                            style={{
                                                                width: `${barWidth}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <strong>
                                                        {item.count}
                                                    </strong>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="empty-state">
                                            No category data available yet.
                                        </p>
                                    )}
                                </article>

                                {/* Recent community reports */}
                                <article className="content-card">
                                    <div className="card-heading">
                                        <h3>
                                            Recent community reports
                                        </h3>

                                        <a href="http://localhost:5000/map.html">
                                            View map →
                                        </a>
                                    </div>

                                    {recentReports.length > 0 ? (
                                        recentReports.map((report) => {
                                            const statusClass = String(
                                                report.status || ""
                                            )
                                                .toLowerCase()
                                                .replaceAll(" ", "-");

                                            return (
                                                <div
                                                    className="report-row"
                                                    key={report.id}
                                                >
                                                    <div className="report-details">
                                                        <strong>
                                                            {report.title}
                                                        </strong>

                                                        <span>
                                                            {report.category}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`status-pill ${statusClass}`}
                                                    >
                                                        {report.status}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="empty-state">
                                            No reports have been submitted yet.
                                        </p>
                                    )}
                                </article>
                            </div>
                        </section>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="site-footer">
                <strong>EcoMap</strong>
                <span>Small actions. Cleaner communities.</span>
            </footer>
        </div>
    );
}

export default App;
