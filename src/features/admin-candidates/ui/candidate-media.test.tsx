import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CandidatePhoto, CandidateVideo } from "./candidate-media";

const URL_MEDIA =
  "https://vt-api.example.org/api/storage/files/0710fd54?token=abc";

describe("CandidateVideo", () => {
  it("ne pose ni balise vidéo ni URL de lecture avant que la zone soit atteinte", () => {
    const markup = renderToStaticMarkup(<CandidateVideo src={URL_MEDIA} />);
    expect(markup).not.toContain("<video");
    expect(markup).not.toContain(URL_MEDIA);
    expect(markup).toContain("Vidéo non téléchargée");
  });
});

describe("CandidatePhoto", () => {
  it("délègue le différé au navigateur, le portrait restant petit", () => {
    const markup = renderToStaticMarkup(
      <CandidatePhoto src={URL_MEDIA} alt="Awa" />,
    );
    expect(markup).toContain(
      '<img src="https://vt-api.example.org/api/storage/files/0710fd54?token=abc"',
    );
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('decoding="async"');
  });
});
