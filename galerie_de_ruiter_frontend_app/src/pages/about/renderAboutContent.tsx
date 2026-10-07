import { inlineFormatting } from "./inlineFormatting";

export function renderAboutContent(content: string) {
  return content.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return null;
    if (/^---+$/.test(line.trim())) return <hr key={index} />;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (!heading) return <p key={index}>{inlineFormatting(line)}</p>;
    const text = inlineFormatting(heading[2]);
    return heading[1].length === 1 ? <h1 key={index}>{text}</h1>
      : heading[1].length === 2 ? <h2 key={index}>{text}</h2> : <h3 key={index}>{text}</h3>;
  });
}
