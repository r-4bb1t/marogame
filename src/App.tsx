import Matter from "matter-js";
import {
  MouseEvent,
  TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { throttle } from "throttle-debounce";

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

const WIDTH = Math.min(window.innerWidth, 400);
const SIZE = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
const DELAY = 1200;

const circleOptions = {
  friction: 0.2,
  mass: 10,
};

let circles: Matter.Body[] = [];
let endCircles: number[] = [];
let gameEnd = false;
let next = 0;
let time = DELAY;

function App() {
  const mainElement = useRef<HTMLDivElement>(null);
  const nextElement = useRef<HTMLDivElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events;

  const wallOptions = {
    label: "static",
    isStatic: true,
    render: {
      fillStyle: "#fff",
    },
  };

  const sensor = Bodies.rectangle(WIDTH / 2, 60, WIDTH, 1, {
    isSensor: true,
    isStatic: true,
    collisionFilter: {
      group: -1,
    },
    render: {
      fillStyle: "#f00",
    },
  });

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

  const checkEnd = throttle(3000, () => {
    setTimeout(() => {
      if (gameEnd) return;
      endCircles = endCircles.filter(
        (id) => circles.find((c) => c.id === id) !== undefined
      );
      if (
        endCircles.some(
          (id) =>
            Matter.Collision.collides(circles.find((c) => c.id === id)!, sensor)
              ?.collided
        )
      ) {
        gameEnd = true;
        setGameOver(true);
      }
    }),
      3000;
  });

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

    Composite.add(engine.world, [sensor, ground, wallLeft, wallRight]);

    Render.run(render);
    const runner = Runner.create();
    runner.delta = 1000 / 120;
    Runner.run(runner, engine);

    Events.on(engine, "collisionEnd", (e) => {
      e.source.pairs.list
        .filter(
          (l: BodyType) =>
            !(
              l.bodyA.collisionFilter.group == -1 ||
              l.bodyB.collisionFilter.group == -1
            )
        )
        .forEach((l: BodyType) => {
          if (!endCircles.includes(l.bodyA.id)) {
            endCircles.push(l.bodyA.id);
          }
          if (!endCircles.includes(l.bodyB.id)) {
            endCircles.push(l.bodyB.id);
          }
        });
      endCircles = endCircles.filter(
        (id) => circles.find((c) => c.id === id) !== undefined
      );

      if (
        e.source.pairs.list.filter(
          (l: BodyType) =>
            !(
              l.bodyA.collisionFilter.group == -1 &&
              l.bodyB.collisionFilter.group == -1
            )
        ).length > 0
      ) {
        checkEnd();
      }
    });

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

          if (l.bodyA.collisionFilter.group === SIZE.length - 2) {
            setTimeout(() => {
              gameEnd = true;
              setWin(true);
            }, 200);
          }

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
  }, [
    Bodies,
    Composite,
    Events,
    Render,
    Runner,
    checkEnd,
    engine,
    ground,
    sensor,
    wallLeft,
    wallRight,
  ]);

  const add = (e: MouseEvent<HTMLElement> | TouchEvent<HTMLElement>) => {
    if (gameEnd) return;
    if (time < DELAY) return;
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
    time = 0;
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
      {win && (
        <div className="w-full h-full absolute inset-0 z-10 bg-black/60 text-white flex items-center flex-col justify-center">
          <div className="emoji">🎉</div>
          <div className="heading">참 잘했어요!</div>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="btn"
          >
            다시하기
          </button>
        </div>
      )}
      {gameOver && (
        <div className="w-full h-full absolute inset-0 z-10 bg-black/60 text-white flex items-center flex-col justify-center">
          <div className="emoji">😭</div>
          <div className="heading">게임 오버</div>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="btn"
          >
            다시하기
          </button>
        </div>
      )}
      <main
        className="w-full max-w-[400px] relative"
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
