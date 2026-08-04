import "../styles/orb.css";

function OrbAI() {
  return (
    <div className="orb-container">
      <div className="aurora"></div>
      <div className="orb">
        <div className="ball">
          <div className="container-lines"></div>
          <div className="container-rings"></div>
          <div className="particle p1"></div>
          <div className="particle p2"></div>
          <div className="particle p3"></div>
          <div className="particle p4"></div>
          <div className="particle p5"></div>
        </div>

        <svg
          className="absolute w-0 h-0 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            <feColorMatrix
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -10"
            />
          </filter>
        </svg>
      </div>
    </div>
  );
}

export default OrbAI;
