import Matter from "matter-js";
import { MouseEvent, useCallback, useEffect, useRef } from "react";

const WIDTH = 384;

function App() {
  const mainElement = useRef<HTMLDivElement>(null);
  const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

  const engine = Engine.create();
  engine.gravity.y = 1;

  const init = useCallback(() => {
    if (!mainElement.current) return;

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

    const ground = Bodies.rectangle(
      WIDTH / 2,
      window.innerHeight - 5,
      WIDTH,
      10,
      {
        isStatic: true,
        render: {
          fillStyle: "#fff",
        },
      }
    );
    const wallLeft = Bodies.rectangle(
      -1,
      window.innerHeight / 2,
      1,
      window.innerHeight,
      {
        isStatic: true,
        render: {
          fillStyle: "#fff",
        },
      }
    );
    const wallRight = Bodies.rectangle(
      WIDTH + 1,
      window.innerHeight / 2,
      1,
      window.innerHeight,
      {
        isStatic: true,
        render: {
          fillStyle: "#fff",
        },
      }
    );
    Composite.add(engine.world, [ground, wallLeft, wallRight]);
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);
  }, [mainElement]);

  const add = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const mouseX =
        e.clientX - mainElement.current!.getBoundingClientRect().left;
      const circle = Bodies.circle(mouseX, 0, 10, {
        render: {
          sprite: {
            texture: "/assets/1.png",
            xScale: 1,
            yScale: 1,
          },
        },
      });
      Composite.add(engine.world, [circle]);
    },
    [engine]
  );

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="w-full h-screen flex flex-col items-center overflow-hidden bg-black">
      <main className="w-96" ref={mainElement} onMouseUp={(e) => add(e)}></main>
    </div>
  );
}

export default App;
