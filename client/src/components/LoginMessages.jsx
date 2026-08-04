import { useEffect, useState } from "react";

const messages = [
  {
    title: (
      <>
        La inteligencia detrás de cada <span className="text-[#02E0F3]">llamada</span>
      </>
    ),
    description:
      "Responde, analiza y transfiere conversaciones de forma inteligente.",
  },
  {
    title: (
      <>
        <span className="text-[#02E0F3]">Automatiza</span> la atención
        <br />
        con IA
      </>
    ),
    description:
      "Brinda respuestas precisas, reduce tiempos de espera y escala a un agente cuando sea necesario.",
  },
  {
    title: (
      <>
        Convierte cada conversación
        en una <span className="text-[#02E0F3]">oportunidad</span>
      </>
    ),
    description:
      "Obtén métricas, aprende de cada interacción y mejora continuamente la experiencia de tus clientes.",
  },
];

export default function LoginMessages() {
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 450);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-10 w-[380px]">

      <p className="font-montserrat text-[17px] font-bold tracking-wide text-[#02E0F3]">
        Bienvenido
      </p>

      {/* Título + descripción juntos en flujo normal (sin absolute ni alturas
          reservadas): la descripción va SIEMPRE pegada debajo del título, tenga
          este 2 o 3 líneas. min-h reserva un mínimo para que el bloque no brinque
          al cambiar de mensaje. La animación se aplica al bloque completo. */}
      <div className="min-h-[150px] mt-3">
        <div
          className={`
            transition-all duration-500 ease-in-out
            ${visible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}
          `}
        >
          <h2 className="font-montserrat font-bold text-[30px] leading-[34px] text-white">
            {messages[index].title}
          </h2>

          <p className="mt-3 font-montserrat font-medium text-[15px] leading-[21px] text-white/90">
            {messages[index].description}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        {messages.map((_, i) => (
          <div
            key={i}
            className={`
              h-[8px] w-[8px] rounded-full transition-all duration-500
              ${index === i ? "bg-[#02E0F3] scale-110" : "bg-[#546999]/50"}
            `}
          />
        ))}
      </div>

    </div>
  );
}