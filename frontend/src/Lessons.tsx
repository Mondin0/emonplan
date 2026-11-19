import {useEffect, useRef, useState} from 'react';
import {modules} from './course';
import type {LessonContent} from './lessonContent';
import {LessonDiagram, diagramCaptions, states} from './LessonDiagram';

const orderedLessons = modules.flatMap(module => module.lessons);

const toolDescriptions = {
  pelacables: 'Pelacables manual con mordazas perforadas para distintas secciones.',
  destornilladores: 'Dos destornilladores, uno de punta plana y otro de punta Phillips.',
  alicate: 'Alicate de corte diagonal con dos filos cortos cerca de la punta.',
  pasacables: 'Guía enrollada con una punta flexible de arrastre.',
};

export function Lessons({onNavigate}: {onNavigate?: (destination: string) => void}) {
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnTo = useRef<LessonContent | null>(null);
  const catalogButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (lesson) heading.current?.focus();
    else if (returnTo.current) catalogButton.current?.focus();
  }, [lesson]);

  function open(next: LessonContent | null) {
    returnTo.current = lesson;
    setLesson(next);
  }

  if (!lesson) return (
    <section className="card lesson lesson-overview">
      <h3>Electricidad domiciliaria</h3>
      <p>Recorré {orderedLessons.length} lecciones desde el primer relevamiento hasta el diagnóstico de una falla. Podés seguir el orden o abrir el tema que necesitás.</p>
      <div className="lesson-modules">
        {modules.map(module => (
          <section key={module.title} className="lesson-module">
            <h4>{module.title}</h4>
            <ul className="lesson-catalog">
              {module.lessons.map(item => (
                <li key={item.title}><button ref={returnTo.current === item ? catalogButton : undefined} onClick={() => open(item)}>{item.title}</button></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );

  const index = orderedLessons.indexOf(lesson);
  return <Lesson key={lesson.title} lesson={lesson} number={index + 1} total={orderedLessons.length}
    heading={heading} back={() => open(null)}
    next={index + 1 < orderedLessons.length ? () => open(orderedLessons[index + 1]) : undefined}
    onNavigate={index + 1 === orderedLessons.length ? onNavigate : undefined}/>;
}

function Lesson({lesson, number, total, heading, back, next, onNavigate}: {
  lesson: LessonContent;
  number: number;
  total: number;
  heading: React.Ref<HTMLHeadingElement>;
  back: () => void;
  next?: () => void;
  onNavigate?: (destination: string) => void;
}) {
  const [component, setComponent] = useState<number | null>(null);
  const [frame, setFrame] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const {title, intro, details, diagram, components, toolImage, question, answers, source} = lesson;
  const comparison = typeof diagram === 'string' ? states[diagram] : undefined;
  const feedback = answer === null ? null : answers[answer];

  return (
    <article className="card lesson lesson-article">
      <button className="lesson-back" onClick={back}>Volver a lecciones</button>
      <p className="lesson-position">Lección {number} de {total}</p>
      <h3 ref={heading} tabIndex={-1}>{title}</h3>
      <p>{intro}</p>
      {toolImage && <figure>
        <div className={`lesson-tool lesson-tool-${toolImage}`}>
          <img src="/herramientas-instalacion.png" width="1254" height="1254" alt={toolDescriptions[toolImage]}/>
        </div>
        <figcaption>Ilustración para reconocer la herramienta.</figcaption>
      </figure>}
      {typeof diagram === 'string' ? (
        <figure aria-label="Diagrama didáctico">
          <LessonDiagram diagram={diagram} title={title} selected={component} frame={frame}/>
          <figcaption>{diagramCaptions[diagram]}</figcaption>
        </figure>
      ) : (
        <figure className="lesson-flow" aria-label="Diagrama didáctico">
          <figcaption>{diagram.caption}</figcaption>
          {diagram.lanes.map(([label, ...steps]) => (
            <div className="lesson-flow-lane" key={label}>
              <strong>{label}</strong>
              <ol role="list" aria-label={label}>
                {steps.map(step => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ))}
        </figure>
      )}
      {components && <fieldset>
        <legend>Explorá los componentes</legend>
        <div className="lesson-controls">
          {components.map(({name}, i) => <button key={name} aria-pressed={i === component} onClick={() => setComponent(i)}>{name}</button>)}
        </div>
        <p role="status">{component === null ? 'Elegí un componente para ver su función.' : components[component].description}</p>
      </fieldset>}
      {comparison && <fieldset>
        <legend>Compará los estados</legend>
        <div className="lesson-controls">
          {comparison.map(({label}, i) => <button key={label} aria-pressed={frame === i} onClick={() => setFrame(i)}>{label}</button>)}
        </div>
        <p role="status">{comparison[frame].description}</p>
      </fieldset>}
      {details?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <fieldset>
        <legend>Pregunta de repaso</legend>
        <p>{question}</p>
        <div className="lesson-controls">
          {answers.map(({label}, i) => <button key={label} aria-pressed={i === answer} onClick={() => setAnswer(i)}>{label}</button>)}
        </div>
        <p role="status" aria-label="Devolución">{feedback && `${feedback.correct ? 'Correcto.' : 'Revisá tu respuesta.'} ${feedback.explanation}`}</p>
      </fieldset>
      {source && <p className="lesson-source"><a href={source.url} target="_blank" rel="noreferrer">{source.label} (abre en otra pestaña)</a></p>}
      {onNavigate && <div className="lesson-controls">
        {['Obras', 'Clientes', 'Materiales'].map(page => <button key={page} onClick={() => onNavigate(page)}>Ir a {page}</button>)}
      </div>}
      {next && <button onClick={next}>Siguiente lección</button>}
    </article>
  );
}
