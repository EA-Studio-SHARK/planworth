import { ArrowUpRight } from "@phosphor-icons/react";
import { usePrefs } from "../context/Prefs";

const COURSE_URL = "https://www.exploreai.chat";

export function CourseCta() {
  const { t } = usePrefs();
  const c = t.col;
  return (
    <aside className="course-cta" aria-label={c.courseTitle}>
      <div>
        <em>{c.courseKicker}</em>
        <h2>{c.courseTitle}</h2>
        <p>{c.courseBody}</p>
        <ul>
          {c.courseLessons.map((lesson) => (
            <li key={lesson}>{lesson}</li>
          ))}
        </ul>
      </div>
      <a className="cta is-blue" href={COURSE_URL} target="_blank" rel="noreferrer">
        {c.courseGo} <ArrowUpRight size={16} weight="bold" />
      </a>
    </aside>
  );
}
