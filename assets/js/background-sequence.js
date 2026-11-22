const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const backgroundVideos = document.querySelectorAll(
  ".career-background-video, #project .background-video, #free-time .free-time-video"
);

if (reducedMotion) {
  backgroundVideos.forEach((video) => video.pause());
} else {
  document.querySelectorAll("[data-video-sequence]").forEach((sequence) => {
    const videos = Array.from(sequence.querySelectorAll(".free-time-video"));
    if (videos.length < 2) {
      return;
    }

    const transitionMs = Number(sequence.dataset.transitionMs) || 2400;
    const shouldLoop = sequence.dataset.loop !== "false";
    const playCounts = videos.map(() => 1);
    const previousTimes = videos.map(() => 0);
    let activeIndex = videos.findIndex((video) => video.classList.contains("is-active"));
    let isTransitioning = false;
    let failedAtIndex = -1;
    let isVisible = false;

    if (activeIndex < 0) {
      activeIndex = 0;
      videos[activeIndex].classList.add("is-active");
    }

    const playActiveVideo = () => {
      if (!isVisible || document.hidden) {
        return;
      }

      videos[activeIndex].play().catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Background video playback failed.", error);
        }
      });
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            playActiveVideo();
          } else {
            videos.forEach((video) => video.pause());
          }
        },
        { rootMargin: "50px 0px" }
      );
      observer.observe(sequence);
    } else {
      isVisible = true;
      playActiveVideo();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        videos.forEach((video) => video.pause());
      } else {
        playActiveVideo();
      }
    });

    const transitionToNext = async () => {
      if (isTransitioning || !isVisible || document.hidden) {
        return;
      }

      const currentIndex = activeIndex;
      const nextIndex = currentIndex + 1 < videos.length ? currentIndex + 1 : 0;
      if (nextIndex === 0 && currentIndex === videos.length - 1 && !shouldLoop) {
        return;
      }

      isTransitioning = true;
      const currentVideo = videos[currentIndex];
      const nextVideo = videos[nextIndex];
      if (nextVideo.readyState > 0) {
        nextVideo.currentTime = 0;
      }

      try {
        await nextVideo.play();
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Background video playback failed.", error);
          failedAtIndex = currentIndex;
        }
        isTransitioning = false;
        return;
      }

      if (!isVisible || document.hidden) {
        nextVideo.pause();
        isTransitioning = false;
        return;
      }

      nextVideo.classList.add("is-active");
      currentVideo.classList.remove("is-active");
      activeIndex = nextIndex;
      playCounts[nextIndex] = 1;
      previousTimes[nextIndex] = 0;

      window.setTimeout(() => {
        currentVideo.pause();
        isTransitioning = false;
        failedAtIndex = -1;
      }, transitionMs);
    };

    videos.forEach((video, index) => {
      video.addEventListener("timeupdate", () => {
        if (video.currentTime + 0.5 < previousTimes[index]) {
          playCounts[index] += 1;
        }
        previousTimes[index] = video.currentTime;

        if (
          index !== activeIndex ||
          isTransitioning ||
          failedAtIndex === index ||
          !isVisible ||
          document.hidden
        ) {
          return;
        }

        const repeatCount = Math.max(1, Number(video.dataset.repeat) || 1);
        const remaining = video.duration - video.currentTime;
        if (playCounts[index] >= repeatCount && remaining <= transitionMs / 1000) {
          transitionToNext();
        }
      });
    });
  });
}
