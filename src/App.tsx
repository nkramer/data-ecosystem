import { useEffect, useMemo, useState } from "react";
import YAML from "yaml";
import layercakeRaw from "../layercake.yaml?raw";

type RawLayer = {
  name: string;
  description?: string;
  children?: Array<RawLayer | string>;
};

type LayerNode = {
  name: string;
  description: string;
  children?: LayerNode[];
};

type LayercakeFile = {
  analytics_layer_cake?: RawLayer[];
};

const normalizeLayer = (layer: RawLayer | string): LayerNode => {
  if (typeof layer === "string") {
    return { name: layer, description: "" };
  }

  const children = Array.isArray(layer.children)
    ? layer.children.map(normalizeLayer)
    : undefined;

  return {
    name: layer.name,
    description: layer.description ?? "",
    children: children && children.length > 0 ? children : undefined,
  };
};

const parsed = YAML.parse(layercakeRaw) as LayercakeFile;
const layers = Array.isArray(parsed?.analytics_layer_cake)
  ? parsed.analytics_layer_cake.map(normalizeLayer)
  : [];

const catalogLayer = layers.find((layer) =>
  layer.name.toLowerCase().includes("catalogs")
);
const mainLayers = catalogLayer
  ? layers.filter((layer) => layer !== catalogLayer)
  : layers;

const getHashPath = () => {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) {
    return [];
  }
  return raw
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .filter(Boolean);
};

const findNodeByPath = (sourceLayers: LayerNode[], path: string[]) => {
  let currentLayers = sourceLayers;
  let currentNode: LayerNode | null = null;

  for (const segment of path) {
    currentNode = currentLayers.find((layer) => layer.name === segment) ?? null;
    if (!currentNode) {
      return null;
    }
    currentLayers = currentNode.children ?? [];
  }

  return currentNode;
};

const toHash = (path: string[]) =>
  path.map((segment) => encodeURIComponent(segment)).join("/");

export default function App() {
  const [path, setPath] = useState<string[]>(getHashPath());

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const selectedLayer = useMemo(
    () => findNodeByPath(layers, path),
    [path]
  );
  const detailLayers = selectedLayer?.children ?? [];
  const isDetailView = path.length > 0 && selectedLayer !== null;
  const pageTitle = selectedLayer?.name ?? "The Analytics Data Stack";

  const handleLayerClick = (layer: LayerNode, basePath: string[]) => {
    window.location.hash = toHash([...basePath, layer.name]);
  };

  const handleBack = () => {
    const nextPath = path.slice(0, -1);
    window.location.hash = toHash(nextPath);
  };

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">{pageTitle}</h1>
        {isDetailView && (
          <button className="page__back" type="button" onClick={handleBack}>
            {path.length === 1 ? "Back to main stack" : "Back"}
          </button>
        )}
      </header>
      {isDetailView ? (
        <section className="stack stack--detail" aria-label={pageTitle}>
          {detailLayers.map((layer) =>
            layer.children ? (
              <button
                className="layer layer--interactive"
                key={layer.name}
                type="button"
                onClick={() => handleLayerClick(layer, path)}
              >
                <h2 className="layer__title">{layer.name}</h2>
                {layer.description ? (
                  <p className="layer__description">{layer.description}</p>
                ) : null}
              </button>
            ) : (
              <article className="layer" key={layer.name}>
                <h2 className="layer__title">{layer.name}</h2>
                {layer.description ? (
                  <p className="layer__description">{layer.description}</p>
                ) : null}
              </article>
            )
          )}
        </section>
      ) : (
        <section className="layout" aria-label="Layercake">
          <section className="stack stack--main">
            {mainLayers.map((layer) =>
              layer.children ? (
                <button
                  className="layer layer--interactive"
                  key={layer.name}
                  type="button"
                  onClick={() => handleLayerClick(layer, [])}
                >
                  <h2 className="layer__title">{layer.name}</h2>
                  <p className="layer__description">{layer.description}</p>
                </button>
              ) : (
                <article className="layer" key={layer.name}>
                  <h2 className="layer__title">{layer.name}</h2>
                  <p className="layer__description">{layer.description}</p>
                </article>
              )
            )}
          </section>
          {catalogLayer && (
            <aside className="stack stack--side" aria-label="Catalogs">
              <button
                className="layer layer--interactive layer--side"
                type="button"
                onClick={() => handleLayerClick(catalogLayer, [])}
              >
                <h2 className="layer__title">{catalogLayer.name}</h2>
                <p className="layer__description">{catalogLayer.description}</p>
              </button>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
