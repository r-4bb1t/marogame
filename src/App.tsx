import Matter from "matter-js";
import { MouseEvent, TouchEvent, useCallback, useEffect, useRef } from "react";

interface BodyType {
  bodyA: {
    label: string;
    id: number;
    collisionFilter: { group: number };
    bounds: {
      min: {
        x: number;
        y: number;
      };
      max: {
        x: number;
        y: number;
      };
    };
  };
  bodyB: {
    label: string;
    id: number;
    collisionFilter: { group: number };
    bounds: {
      min: {
        x: number;
        y: number;
      };
      max: {
        x: number;
        y: number;
      };
    };
  };
}

const WIDTH = 384;
const SIZE = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
const DELAY = 1500;

const circleOptions = {
  friction: 0.2,
  mass: 10,
};

let circles: Matter.Body[] = [];
let next = 0;
let time = DELAY;

function App() {
  const mainElement = useRef<HTMLDivElement>(null);
  const nextElement = useRef<HTMLDivElement>(null);

  const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events;

  const engine = Engine.create();
  engine.gravity.y = 1;

  const setNextElementStyle = (init?: boolean) => {
    nextElement.current!.style.display = "none";
    setTimeout(
      () => {
        nextElement.current!.style.width = SIZE[next] * 2 + "px";
        nextElement.current!.style.height = SIZE[next] * 2 + "px";
        nextElement.current!.style.backgroundImage = `url(/assets/${
          next + 1
        }.png)`;
        nextElement.current!.style.backgroundSize = "contain";
        nextElement.current!.style.display = "block";
      },
      init ? 1 : DELAY
    );
  };

  const nextElementMoveX = (
    e: MouseEvent<HTMLElement, globalThis.MouseEvent> | TouchEvent<HTMLElement>
  ) => {
    let x = 0;
    if (e.type === "mousemove") {
      x =
        (e as MouseEvent<HTMLElement, globalThis.MouseEvent>).clientX -
        (window.innerWidth - WIDTH) / 2 -
        SIZE[next];
    } else if (e.type === "touchmove") {
      x =
        (e as TouchEvent<HTMLElement>).touches[0].clientX -
        (window.innerWidth - WIDTH) / 2 -
        SIZE[next];
    }
    nextElement.current!.style.left =
      Math.min(Math.max(x, 0), WIDTH - SIZE[next] * 2) + "px";
  };

  const init = useCallback(() => {
    if (!mainElement.current) return;
    setNextElementStyle(true);

    const render = Render.create({
      element: mainElement.current!,
      engine: engine,
      options: {
        width: WIDTH,
        height: window.innerHeight,
        wireframes: false,
        background: "#fff",
      },
    });

    const wallOptions = {
      label: "static",
      isStatic: true,
      render: {
        fillStyle: "#fff",
      },
    };

    const ground = Bodies.rectangle(
      WIDTH / 2,
      window.innerHeight + 50,
      WIDTH,
      100,
      wallOptions
    );
    const wallLeft = Bodies.rectangle(
      -50,
      window.innerHeight / 2,
      100,
      window.innerHeight,
      wallOptions
    );
    const wallRight = Bodies.rectangle(
      WIDTH + 50,
      window.innerHeight / 2,
      100,
      window.innerHeight,
      wallOptions
    );
    Composite.add(engine.world, [ground, wallLeft, wallRight]);
    Render.run(render);
    const runner = Runner.create();
    runner.delta = 1000 / 120;
    Runner.run(runner, engine);

    Events.on(engine, "collisionStart", (e) => {
      e.source.pairs.list
        .filter(
          (l: BodyType) =>
            !(l.bodyA.label === "static" || l.bodyB.label === "static")
        )
        .forEach((l: BodyType) => {
          if (l.bodyA.collisionFilter.group !== l.bodyB.collisionFilter.group) {
            return;
          }
          if (
            circles.filter((c) => c.id === l.bodyA.id || c.id === l.bodyB.id)
              .length !== 2
          ) {
            return;
          }

          Composite.remove(
            engine.world,
            circles.filter((c) => c.id === l.bodyA.id || c.id === l.bodyB.id)
          );

          const newCircle = Bodies.circle(
            Math.max(
              Math.min(
                (l.bodyA.bounds.min.x + l.bodyB.bounds.min.x) / 2,
                WIDTH - SIZE[l.bodyA.collisionFilter.group + 1]
              ),
              SIZE[l.bodyA.collisionFilter.group + 1]
            ),
            Math.min(
              (l.bodyA.bounds.min.y + l.bodyB.bounds.min.y) / 2,
              window.innerHeight - SIZE[l.bodyA.collisionFilter.group + 1]
            ),
            SIZE[l.bodyA.collisionFilter.group + 1],
            {
              collisionFilter: {
                group: l.bodyA.collisionFilter.group + 1,
              },
              render: {
                sprite: {
                  texture: `/assets/${
                    l.bodyA.collisionFilter.group + 1 + 1
                  }.png`,
                  xScale: 1,
                  yScale: 1,
                },
              },
              ...circleOptions,
            }
          );

          Composite.add(engine.world, [newCircle]);
          circles = circles.filter(
            (c) => c.id !== l.bodyA.id && c.id !== l.bodyB.id
          );
          circles.push(newCircle);
        });
    });
  }, [Bodies, Composite, Events, Render, Runner, engine]);

  const add = (e: MouseEvent<HTMLElement> | TouchEvent<HTMLElement>) => {
    if (time < DELAY) return;
    time = 0;
    const mouseX =
      e.type === "mouseup"
        ? (e as MouseEvent<HTMLElement>).clientX -
          mainElement.current!.getBoundingClientRect().left
        : (e as TouchEvent<HTMLElement>).changedTouches[0].clientX -
          mainElement.current!.getBoundingClientRect().left;
    const circle = Bodies.circle(
      Math.max(Math.min(WIDTH - SIZE[next], mouseX), SIZE[next]),
      8 + SIZE[next],
      SIZE[next],
      {
        collisionFilter: {
          group: next,
        },
        render: {
          sprite: {
            texture: `/assets/${next + 1}.png`,
            xScale: 1,
            yScale: 1,
          },
        },
        ...circleOptions,
      }
    );
    Composite.add(engine.world, [circle]);
    circles.push(circle);
    next = Math.floor(Math.random() * 3);
    setNextElementStyle();
  };

  useEffect(() => {
    init();
    const interval = setInterval(() => {
      time += 100;
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center overflow-hidden bg-black">
      <main
        className="w-96 relative"
        ref={mainElement}
        onMouseUp={(e) => add(e)}
        onTouchEnd={(e) => add(e)}
        onMouseMove={(e) => nextElementMoveX(e)}
        onTouchMove={(e) => nextElementMoveX(e)}
      >
        <div ref={nextElement} className="absolute top-2" />
      </main>
    </div>
  );
}

export default App;
