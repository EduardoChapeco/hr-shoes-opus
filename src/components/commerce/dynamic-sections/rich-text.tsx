export function RichText({ content }: { content: Record<string, unknown> }) {
  const text = String(content.content || content.text || "");
  if (!text) return null;
  return (
    <section className="mx-auto max-w-screen-xl px-4 @md:px-6 py-8">
      <div className="prose dark:prose-invert max-w-3xl mx-auto text-center">
        <p className="text-lg text-muted-foreground whitespace-pre-wrap">{text}</p>
      </div>
    </section>
  );
}
