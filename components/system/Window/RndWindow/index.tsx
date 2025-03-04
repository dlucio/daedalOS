import useRnd from "components/system/Window/RndWindow/useRnd";
import { useProcesses } from "contexts/process";
import { useSession } from "contexts/session";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import {
  FOCUSABLE_ELEMENT,
  PREVENT_SCROLL,
  PROCESS_DELIMITER,
  TRANSITIONS_IN_MILLISECONDS,
} from "utils/constants";
import { haltEvent, pxToNum } from "utils/functions";

type RndWindowProps = {
  id: string;
  zIndex: number;
};

const reRouteFocus =
  (focusElement?: HTMLElement) =>
  (element?: Element): void => {
    element?.setAttribute("tabindex", FOCUSABLE_ELEMENT.tabIndex.toString());
    element?.addEventListener("contextmenu", haltEvent);
    element?.addEventListener("mousedown", (event) => {
      event.preventDefault();
      focusElement?.focus(PREVENT_SCROLL);
    });
  };

const RndWindow: FC<RndWindowProps> = ({ children, id, zIndex }) => {
  const {
    linkElement,
    maximize,
    processes: { [id]: process },
  } = useProcesses();
  const {
    closing,
    componentWindow,
    maximized,
    minimized,
    url = "",
  } = process || {};
  const rndRef = useRef<Rnd | null>(null);
  const rndProps = useRnd(id, maximized);
  const { setWindowStates, windowStates: { [id]: windowState } = {} } =
    useSession();
  const { maximized: wasMaximized } = windowState || {};
  const [openedMaximized, setOpenedMaximized] = useState(false);
  const style = useMemo<React.CSSProperties>(
    () => ({
      pointerEvents: minimized ? "none" : undefined,
      zIndex,
    }),
    [minimized, zIndex]
  );

  useLayoutEffect(() => {
    if (wasMaximized && !openedMaximized && process) {
      setTimeout(() => maximize(id), TRANSITIONS_IN_MILLISECONDS.WINDOW * 1.25);
      setOpenedMaximized(true);
    }
  }, [id, maximize, openedMaximized, process, wasMaximized]);

  useLayoutEffect(() => {
    const { current: currentWindow } = rndRef;
    const rndWindowElements =
      currentWindow?.resizableElement?.current?.children || [];
    const [windowContainer, resizeHandleContainer] =
      rndWindowElements as HTMLElement[];
    const resizeHandles = [...(resizeHandleContainer?.children || [])];

    resizeHandles.forEach(reRouteFocus(windowContainer));

    if (process && !componentWindow && windowContainer) {
      linkElement(id, "componentWindow", windowContainer);
    }

    return () => {
      if (closing) {
        const [pid] = id.split(PROCESS_DELIMITER);

        setWindowStates((currentWindowStates) => ({
          ...currentWindowStates,
          [pid === id ? id : `${pid}${PROCESS_DELIMITER}${url}`]: {
            maximized,
            position: currentWindow?.props.position,
            size: currentWindow?.props.size
              ? {
                  height: pxToNum(currentWindow?.props.size.height),
                  width: pxToNum(currentWindow?.props.size.width),
                }
              : undefined,
          },
        }));
      }
    };
  }, [
    closing,
    componentWindow,
    id,
    linkElement,
    maximized,
    process,
    setWindowStates,
    url,
  ]);

  return (
    <Rnd ref={rndRef} style={style} {...rndProps}>
      {children}
    </Rnd>
  );
};

export default RndWindow;
