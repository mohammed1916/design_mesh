import React, { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export const ParticleEffect: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const createParticle = (): Particle => ({
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 10,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    });

    const initialParticles = Array.from({ length: 20 }, createParticle);
    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(particle => ({
          ...particle,
          y: particle.y - particle.speed,
        })).filter(particle => particle.y > -10);

        if (updated.length < 20) {
          updated.push(createParticle());
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="particles">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDelay: `${Math.random() * 6}s`,
          }}
        />
      ))}
    </div>
  );
};
