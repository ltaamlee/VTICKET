
import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

function Page403() {
  return (
    <StyledWrapper>
      <main className="error-container">
        <svg className="face" viewBox="0 0 320 380">
          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={25}
          >
            <g className="face__eyes" transform="translate(0,112.5)">
              <g transform="translate(15,0)">
                <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                <polyline
                  className="face__pupil"
                  points="55,120 55,155"
                  strokeDasharray="35 35"
                />
              </g>
              <g transform="translate(230,0)">
                <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                <polyline
                  className="face__pupil"
                  points="55,120 55,155"
                  strokeDasharray="35 35"
                />
              </g>
            </g>

            <rect
              className="face__nose"
              x="132.5"
              y="112.5"
              width={55}
              height={155}
              rx={4}
              ry={4}
            />

            <g transform="translate(65,334)" strokeDasharray="102 102">
              <path className="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
              <path className="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
            </g>
          </g>
        </svg>

        <h1>Truy cập bị từ chối</h1>
        <p>
          Bạn không có quyền truy cập vào trang này.
        </p>

        <div className="actions">
          <Link to="/" className="home-button">
            Về trang chủ
          </Link>
        </div>
      </main>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .error-container {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    background: #f9fafb;
    color: #1a1a1a;
    text-align: center;
  }

  .face {
    width: 180px;
    max-width: 100%;
  }

  .face__eyes,
  .face__eye-lid,
  .face__mouth-left,
  .face__mouth-right,
  .face__nose,
  .face__pupil {
    animation: eyes 1s 0.3s forwards;
  }

  .face__eye-lid,
  .face__pupil {
    animation-duration: 4s;
    animation-delay: 1.3s;
    animation-iteration-count: infinite;
  }

  .face__eye-lid { animation-name: eye-lid; }
  .face__mouth-left { animation-name: mouth-left; }
  .face__mouth-right { animation-name: mouth-right; }
  .face__nose { animation-name: nose; }
  .face__pupil { animation-name: pupil; }

  h1 {
    margin: 8px 0 0;
    font-size: 64px;
    font-weight: 800;
    color: #2563eb;
  }

  h2 {
    margin: 8px 0;
    font-size: 24px;
    font-weight: 700;
  }

  p {
    max-width: 420px;
    margin: 8px 0 24px;
    color: #6b7280;
    line-height: 1.6;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .login-button,
  .home-button {
    padding: 12px 22px;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
  }

  .login-button {
    background: #2563eb;
    color: white;
  }

  .login-button:hover { background: #1d4ed8; }

  .home-button {
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .home-button:hover { background: #e5e7eb; }

  @keyframes eye-lid {
    0%, 40%, 45%, 100% { transform: translateY(0); }
    42.5% { transform: translateY(17.5px); }
  }

  @keyframes eyes {
    from { transform: translateY(112.5px); }
    to { transform: translateY(15px); }
  }

  @keyframes pupil {
    0%, 37.5%, 40%, 45%, 87.5%, 100% {
      stroke-dashoffset: 0;
      transform: translate(0, 0);
    }
    12.5%, 25%, 62.5%, 75% {
      transform: translate(-35px, 0);
    }
    42.5% {
      stroke-dashoffset: 35;
      transform: translate(0, 17.5px);
    }
  }

  @keyframes mouth-left {
    from, 50% { stroke-dashoffset: -102; }
    to { stroke-dashoffset: 0; }
  }

  @keyframes mouth-right {
    from, 50% { stroke-dashoffset: 102; }
    to { stroke-dashoffset: 0; }
  }

  @keyframes nose {
    from { transform: translate(0, 0); }
    to { transform: translate(0, 22.5px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .face__eyes,
    .face__eye-lid,
    .face__mouth-left,
    .face__mouth-right,
    .face__nose,
    .face__pupil {
      animation: none;
    }
  }
`;

export default Page403;