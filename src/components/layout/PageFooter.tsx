import { OTHER_TOOLS } from '@/styles';

/** Links to the owner's other tools. */
export function PageFooter() {
  return (
    <footer className="page-footer">
      <span>Other tools from thevoidwatches:</span>
      <ul>
        {OTHER_TOOLS.map((tool) => (
          <li key={tool.url}>
            <a href={tool.url}>{tool.name}</a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
