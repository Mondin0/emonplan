import {useEffect, useRef, useState} from 'react';
import {lessons} from './lessonContent';
import {LessonDiagram, states} from './LessonDiagram';

export function Lessons() {
  const [lesson, setLesson] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);

  useEffect(() => {
    if (moveFocus.current) heading.current?.focus();
  }, [lesson]);

  function open(index: number | null) {
    moveFocus.current = true;
    setLesson(index);
  }

  return lesson === null ? (
    <section className="card lesson">
      <h3 ref={heading} tabIndex={-1}>Electricidad monofásica</h3>
      <p>Repasá los fundamentos y aplicalos a casos domiciliarios. Podés seguir el orden sugerido o abrir un tema directamente.</p>
      <ol className="lesson-catalog">
        {lessons.map(({title}, index) => <li key={title}><button onClick={() => open(index)}>{title}</button></li>)}
      </ol>
    </section>
  ) : (
    <Lesson key={lesson} index={lesson} heading={heading} open={open}/>
  );
}

function Lesson({index, heading, open}: {
  index: number;
  heading: React.Ref<HTMLHeadingElement>;
  open: (index: number | null) => void;
}) {
  const [component, setComponent] = useState<number | null>(null);
  const [alternate, setAlternate] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const {title, intro, components, question, answers} = lessons[index];
  const comparison = states[index];
  const feedback = answer === null ? null : answers[answer];

  return (
    <article className="card lesson">
      <button onClick={() => open(null)}>Volver a lecciones</button>
      <h3 ref={heading} tabIndex={-1}>{title}</h3>
      <p>{intro}</p>
      <figure>
        <LessonDiagram index={index} title={title} selected={component} alternate={alternate}/>
        <figcaption>Esquema funcional simplificado</figcaption>
      </figure>
      <fieldset>
        <legend>Explorá los componentes</legend>
        <div className="lesson-controls">
          {components.map(({name}, i) => <button key={name} aria-pressed={i === component} onClick={() => setComponent(i)}>{name}</button>)}
        </div>
        <p role="status">{component === null ? 'Elegí un componente para ver su función.' : components[component].description}</p>
      </fieldset>
      {comparison && <fieldset>
        <legend>Compará los estados</legend>
        <div className="lesson-controls">
          {comparison.map(({label}, i) => <button key={label} aria-pressed={alternate === Boolean(i)} onClick={() => setAlternate(Boolean(i))}>{label}</button>)}
        </div>
        <p role="status">{comparison[Number(alternate)].description}</p>
      </fieldset>}
      <fieldset>
        <legend>Pregunta de repaso</legend>
        <p>{question}</p>
        <div className="lesson-controls">
          {answers.map(({label}, i) => <button key={label} aria-pressed={i === answer} onClick={() => setAnswer(i)}>{label}</button>)}
        </div>
        <p role="status" aria-label="Devolución">{feedback && `${feedback.correct ? 'Correcto.' : 'Revisá tu respuesta.'} ${feedback.explanation}`}</p>
      </fieldset>
      {index + 1 < lessons.length && <button onClick={() => open(index + 1)}>Siguiente lección</button>}
    </article>
  );
}
