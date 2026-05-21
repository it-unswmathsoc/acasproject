import katex from 'katex';
import 'katex/dist/katex.min.css';

const EXISTING_MATH_PATTERN = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;

function applyAutoMath(text) {
  let t = text;

  t = t.replace(/(?<!\$)\b(\d+)\s*\/\s*(\d+)\b(?!\$)/g, (_, num, den) => `$\\frac{${num}}{${den}}$`);

  t = t.replace(/\bsqrt\s*\(\s*([^)]+?)\s*\)/gi, (_, inner) => `$\\sqrt{${inner.trim()}}$`);
  t = t.replace(/\bsqrt\s*\{\s*([^}]+?)\s*\}/gi, (_, inner) => `$\\sqrt{${inner.trim()}}$`);

  t = t.replace(/\b([a-zA-Z0-9]+)\^\{([^}]+)\}/g, (_, base, exp) => `$${base}^{${exp}}$`);
  t = t.replace(/\b([a-zA-Z0-9]+)\^([a-zA-Z0-9.+-]+)/g, (_, base, exp) => `$${base}^{${exp}}$`);
  t = t.replace(/\b([a-zA-Z0-9]+)\*\*([a-zA-Z0-9.+-]+)/g, (_, base, exp) => `$${base}^{${exp}}$`);

  return t;
}

/** Converts plain math shorthands (1/2, sqrt(5), x^2) outside existing $...$ blocks. */
export function prepareLatexPreviewText(text) {
  const parts = text.split(EXISTING_MATH_PATTERN);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return part;
    }
    return applyAutoMath(part);
  }).join('');
}

function parseLatexSegments(text) {
  const segments = [];
  const pattern = /\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      segments.push({ type: 'display', content: match[1].trim() });
    } else {
      segments.push({ type: 'inline', content: match[2].trim() });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

function renderMath(content, displayMode) {
  try {
    return {
      html: katex.renderToString(content, {
        displayMode,
        throwOnError: false,
        strict: 'ignore',
      }),
      error: null,
    };
  } catch (error) {
    return { html: '', error: error.message };
  }
}

export default function LatexPreview({ text }) {
  const trimmed = text.trim();

  if (!trimmed) {
    return (
      <div className="ms-latex-preview ms-latex-preview--empty">
        Preview auto-formats <code>1/2</code>, <code>sqrt(5)</code>, and <code>x^2</code> (or <code>x**2</code>).
        Use <code>$...$</code> for other inline math and <code>$$...$$</code> for display math.
      </div>
    );
  }

  const prepared = prepareLatexPreviewText(text);
  const segments = parseLatexSegments(prepared);

  if (segments.length === 0) {
    return <div className="ms-latex-preview">{text}</div>;
  }

  return (
    <div className="ms-latex-preview">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <span key={index} className="ms-latex-preview__text">
              {segment.content}
            </span>
          );
        }

        const { html, error } = renderMath(segment.content, segment.type === 'display');

        if (error) {
          return (
            <span key={index} className="ms-latex-preview__error">
              {segment.type === 'display' ? `$$${segment.content}$$` : `$${segment.content}$`}
            </span>
          );
        }

        if (segment.type === 'display') {
          return (
            <div
              key={index}
              className="ms-latex-preview__display"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={index}
            className="ms-latex-preview__inline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
}
