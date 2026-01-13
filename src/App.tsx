import YAML from "yaml";
import layercakeRaw from "../layercake.yaml?raw";

type Layer = {
  name: string;
  description: string;
};

type LayercakeFile = {
  analytics_layer_cake?: Layer[];
};

const parsed = YAML.parse(layercakeRaw) as LayercakeFile;
const layers = Array.isArray(parsed?.analytics_layer_cake)
  ? parsed.analytics_layer_cake
  : [];

export default function App() {
  return (
    <main className="page">
      <section className="stack" aria-label="Layercake">
        {layers.map((layer) => (
          <article className="layer" key={layer.name}>
            <h2 className="layer__title">{layer.name}</h2>
            <p className="layer__description">{layer.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
