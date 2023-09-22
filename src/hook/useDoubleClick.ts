/**
 * 双击
 */
import { useCallback, useEffect, useRef } from 'react';

function useDoubleClick(
  actionDoubleClick: Function,
  actionSingleClick: Function = () => {},
  delay = 250
) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const clickCount = useRef(0);

  const handleClick = useCallback(() => {
    clickCount.current += 1;

    if (clickCount.current === 1) {
      timer.current = setTimeout(() => {
        if (clickCount.current === 1 && actionSingleClick) {
          actionSingleClick();
        }
        clickCount.current = 0;
      }, delay);
    } else if (clickCount.current === 2) {
      clearTimeout(timer.current);
      clickCount.current = 0;

      actionDoubleClick && actionDoubleClick();
    }
  }, [actionDoubleClick, actionSingleClick, delay]);

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  return handleClick;
}

export default useDoubleClick;
