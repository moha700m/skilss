import { useState, useEffect, useRef } from "react";

type TypingAnimationState = {
  text: string;
  duration: number;
  visibleChars: number;
  showImage: boolean;
};

export function useInputTyping(
  text: string,
  duration: number,
  isActive: boolean,
  onComplete: () => void,
) {
  const [animationState, setAnimationState] = useState<TypingAnimationState>({
    text: "",
    duration: 0,
    visibleChars: 0,
    showImage: false,
  });
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isActive) return;

    const imageDelay = duration * 0.1;
    const typingStart = duration * 0.15;
    const typingDuration = duration * 0.7;
    const charInterval = typingDuration / text.length;
    const sendDelay = duration * 0.15;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(
        () =>
          setAnimationState({
            text,
            duration,
            visibleChars: 0,
            showImage: false,
          }),
        0,
      ),
    );
    timers.push(
      setTimeout(
        () =>
          setAnimationState((current) => ({
            text,
            duration,
            visibleChars:
              current.text === text && current.duration === duration
                ? current.visibleChars
                : 0,
            showImage: true,
          })),
        imageDelay,
      ),
    );
    for (let i = 0; i < text.length; i++) {
      timers.push(
        setTimeout(
          () =>
            setAnimationState((current) => ({
              text,
              duration,
              visibleChars: i + 1,
              showImage:
                current.text === text && current.duration === duration
                  ? current.showImage
                  : false,
            })),
          typingStart + charInterval * i,
        ),
      );
    }
    timers.push(
      setTimeout(
        () => onCompleteRef.current(),
        typingStart + typingDuration + sendDelay,
      ),
    );

    return () => timers.forEach(clearTimeout);
  }, [isActive, text, duration]);

  const matchesActiveAnimation =
    isActive &&
    animationState.text === text &&
    animationState.duration === duration;

  return {
    displayedText: matchesActiveAnimation
      ? text.slice(0, animationState.visibleChars)
      : "",
    showImage: matchesActiveAnimation && animationState.showImage,
  };
}
