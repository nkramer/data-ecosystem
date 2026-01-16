import { KeyboardEvent, useEffect, useMemo, useState } from "react";
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
const outputLayer = layers.find(
  (layer) => layer.name.toLowerCase() === "output"
);
const mainLayers = catalogLayer
  ? layers.filter((layer) => layer !== catalogLayer && layer !== outputLayer)
  : layers.filter((layer) => layer !== outputLayer);

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
  const pageDescription = selectedLayer?.description ?? "";

  const handleLayerClick = (layer: LayerNode, basePath: string[]) => {
    window.location.hash = toHash([...basePath, layer.name]);
  };

  const handleLayerKeyDown =
    (layer: LayerNode, basePath: string[]) =>
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleLayerClick(layer, basePath);
      }
    };

  const renderChildLinks = (
    layer: LayerNode,
    basePath: string[],
    variant: "inline" | "list" = "inline"
  ) => {
    if (!layer.children?.length) {
      return null;
    }

    const layerPath = [...basePath, layer.name];

    const items = layer.children.flatMap((child, index) => {
      const href = `#${toHash([...layerPath, child.name])}`;
      const link = (
        <a
          className="layer__child"
          href={href}
          key={`${child.name}-link`}
          onClick={(event) => event.stopPropagation()}
        >
          {child.name}
        </a>
      );

      if (variant === "list") {
        return [
          <div className="layer__child-row" key={`${child.name}-row`}>
            <span className="layer__dot" aria-hidden="true">●</span>
            {link}
          </div>,
        ];
      }

      const isLast = index === layer.children!.length - 1;
      if (isLast) {
        return [link];
      }

      return [
        link,
        <span className="layer__dot" aria-hidden="true" key={`${child.name}-dot`}>●</span>,
      ];
    });

    const className =
      variant === "list" ? "layer__children layer__children--list" : "layer__children";

    return (
      <div className={className} aria-label="Child layers">
        {items}
      </div>
    );
  };

  const handleBack = () => {
    const nextPath = path.slice(0, -1);
    window.location.hash = toHash(nextPath);
  };

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">{pageTitle}</h1>
        {pageDescription ? (
          <p className="page__subtitle">{pageDescription}</p>
        ) : null}
        {isDetailView && (
          <button className="page__back" type="button" onClick={handleBack}>
            {path.length === 1 ? "Back to main stack" : "Back"}
          </button>
        )}
      </header>
      {isDetailView ? (
        <section className="stack stack--detail" aria-label={pageTitle}>
          {detailLayers.map((layer) => {
            const isInteractive = Boolean(layer.children?.length);
            const className = isInteractive
              ? "layer layer--interactive"
              : "layer";

            return (
              <article
                className={className}
                key={layer.name}
                onClick={
                  isInteractive
                    ? () => handleLayerClick(layer, path)
                    : undefined
                }
                onKeyDown={
                  isInteractive ? handleLayerKeyDown(layer, path) : undefined
                }
                role={isInteractive ? "button" : undefined}
                tabIndex={isInteractive ? 0 : undefined}
              >
                <h2 className="layer__title">{layer.name}</h2>
                {layer.description ? (
                  <p className="layer__description">{layer.description}</p>
                ) : null}
                {renderChildLinks(layer, path)}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="layout" aria-label="Layercake">
          <section className="stack stack--main">
            {mainLayers.map((layer) => {
              const isInteractive = Boolean(layer.children?.length);
              const className = isInteractive
                ? "layer layer--interactive"
                : "layer";

              return (
                <article
                  className={className}
                  key={layer.name}
                  onClick={
                    isInteractive ? () => handleLayerClick(layer, []) : undefined
                  }
                  onKeyDown={
                    isInteractive ? handleLayerKeyDown(layer, []) : undefined
                  }
                  role={isInteractive ? "button" : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                >
                  <h2 className="layer__title">{layer.name}</h2>
                  <p className="layer__description">{layer.description}</p>
                  {renderChildLinks(layer, [])}
                </article>
              );
            })}
            {outputLayer && (
              <section className="layer__output-row" aria-label="Output">
                {outputLayer.children?.map((child) => {
                  const isInteractive = Boolean(child.children?.length);
                  const className = isInteractive
                    ? "layer layer--interactive layer--output"
                    : "layer layer--output";

                  return (
                    <article
                      className={className}
                      key={`${child.name}-output`}
                      onClick={
                        isInteractive
                          ? () => handleLayerClick(child, [outputLayer.name])
                          : undefined
                      }
                      onKeyDown={
                        isInteractive
                          ? handleLayerKeyDown(child, [outputLayer.name])
                          : undefined
                      }
                      role={isInteractive ? "button" : undefined}
                      tabIndex={isInteractive ? 0 : undefined}
                    >      <h2 className="layer__title">{child.name}</h2>
      {child.description ? (
        <p className="layer__description">{child.description}</p>
      ) : null}
      {renderChildLinks(child, [outputLayer.name])}
</article>
                  );
                })}
              </section>
            )}
          </section>
          {catalogLayer && (
            <aside className="stack stack--side" aria-label="Catalogs">
              <article
                className="layer layer--interactive layer--side"
                onClick={() => handleLayerClick(catalogLayer, [])}
                onKeyDown={handleLayerKeyDown(catalogLayer, [])}
                role="button"
                tabIndex={0}
              >
                <h2 className="layer__title">{catalogLayer.name}</h2>
                <p className="layer__description">{catalogLayer.description}</p>
                {renderChildLinks(catalogLayer, [], "list")}
              </article>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
