// index.js
// Side pager full-page 스크롤 함수 ////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const pager = document.querySelector('.side-pager');
    const headerColorTargets = document.querySelectorAll('header svg, header nav.lang-nav ul li a');
    const pagerItems = pager ? Array.from(pager.querySelectorAll('li')) : [];
    const pagerLinks = pager ? Array.from(pager.querySelectorAll('a')) : [];
    const animationDuration = 600; //애니메이션 페이지 다음-이전 이동 전환 속도

    // DOM 순서대로 모든 섹션(#p1 ~ #pN) 수집
    const sections = Array.from(document.querySelectorAll('[id^="p"]')).filter((section) =>
        /^p\d+$/.test(section.id),
    );
    const lastSectionId = sections.length ? sections[sections.length - 1].id : null;

    function isLastSection(id) {
        return Boolean(lastSectionId && id === lastSectionId);
    }

    let currentIndex = 0;
    let isAnimating = false;

    // side-pager와 header 마지막 섹션에서 숨김 처리
    // 1. nav.side-pager 숨김/드러남 함수:
    //    - 첫 번째 섹션(#p1)일 때도 숨김 처리 (hero 영역에서 페이저 미노출)
    //    - 마지막 섹션일 때도 숨김 처리 (footer 영역)
    function applySidePagerState(id) {
        const isFirstSection = id === 'p1';
        const shouldHidePager = isFirstSection || isLastSection(id);
        if (pager) {
            pager.classList.toggle('is-hidden', shouldHidePager);
        }
    }

    // 2. header 숨김/드러남 함수: 사용자가 보는 위치가 마지막 섹션일 때는 header가 보이지 않아야 함
    function applyHeaderState(id) {
        if (!header) return;
        const shouldHideHeader = isLastSection(id);
        header.classList.toggle('is-hidden', shouldHideHeader);
    }

    // 3. header 색상 변경 함수:
    //    - 첫 번째 섹션(#p1)에서는 ivory 클래스 유지
    //    - 나머지 섹션에서는 black 클래스를 적용
    function applyHeaderColorState(id) {
        const isFirstSection = id === 'p1';
        headerColorTargets.forEach((target) => {
            target.classList.toggle('ivory', isFirstSection);
            target.classList.toggle('black', !isFirstSection);
        });
    }

    function setActiveById(id) {
        const targetHash = `#${id}`;
        pagerItems.forEach((item) => {
            item.classList.remove('on');
            if (!item.className) {
                item.removeAttribute('class');
            }
        });

        for (const link of pagerLinks) {
            if (link.getAttribute('href') === targetHash) {
                link.parentElement?.classList.add('on');
                break;
            }
        }

        // side-pager와 header 숨김/드러남 상태 동기화
        applySidePagerState(id);
        applyHeaderState(id);
        applyHeaderColorState(id);
    }

    function smoothScrollTo(targetY, duration, callback) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = performance.now();

        function easeInOut(progress) {
            return 0.5 * (1 - Math.cos(Math.PI * progress));
        }

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOut(progress);
            window.scrollTo(0, startY + distance * eased);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else if (callback) {
                callback();
            }
        }

        requestAnimationFrame(step);
    }

    function scrollToSection(target) {
        if (!target) {
            return;
        }
        const targetIndex = sections.indexOf(target);
        if (targetIndex === -1) {
            return;
        }
        const targetTop = target.getBoundingClientRect().top + window.pageYOffset;
        isAnimating = true;
        currentIndex = targetIndex;
        setActiveById(target.id);

        smoothScrollTo(targetTop, animationDuration, () => {
            isAnimating = false;
        });
    }

    function updateCurrentIndexFromScroll() {
        if (isAnimating) {
            return;
        }
        const scrollTop = window.pageYOffset;
        const viewportHeight = window.innerHeight;
        let newIndex = currentIndex;

        sections.forEach((section, idx) => {
            const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
            if (scrollTop >= sectionTop - viewportHeight / 2) {
                newIndex = idx;
            }
        });

        if (newIndex !== currentIndex) {
            currentIndex = newIndex;
            setActiveById(sections[currentIndex].id);
        }
    }

    // 현재 스크롤 위치를 기반으로 초기 활성화
    updateCurrentIndexFromScroll();
    if (sections.length) {
        setActiveById(sections[currentIndex].id);
    }

    // 페이저 클릭 핸들러
    pagerLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href');
            if (!targetId) {
                return;
            }
            const targetSection = document.querySelector(targetId);
            scrollToSection(targetSection);
            // :focus 스타일이 지속되지 않도록 포커스 제거
            link.blur();
        });
    });

    // 마우스 휠 네비게이션
    window.addEventListener(
        'wheel',
        (event) => {
            if (isAnimating || !sections.length) {
                // 애니메이션 중 추가 휠 스크롤이 기본 스크롤을 발생시켜 끊기는 느낌이 나므로 막아줌
                event.preventDefault();
                return;
            }
            const { deltaY } = event;
            let targetIndex = currentIndex;
            if (deltaY > 0 && currentIndex < sections.length - 1) {
                targetIndex = currentIndex + 1;
            } else if (deltaY < 0 && currentIndex > 0) {
                targetIndex = currentIndex - 1;
            }
            if (targetIndex !== currentIndex) {
                event.preventDefault();
                scrollToSection(sections[targetIndex]);
            }
        },
        { passive: false },
    );

    // 키보드 네비게이션 (화살표 키)
    window.addEventListener(
        'keydown',
        (event) => {
            if (isAnimating || !sections.length) {
                return;
            }

            const target = event.target;
            const isFormField =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target.isContentEditable;

            if (isFormField) {
                return;
            }

            let targetIndex = currentIndex;

            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                if (currentIndex < sections.length - 1) {
                    targetIndex = currentIndex + 1;
                }
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                if (currentIndex > 0) {
                    targetIndex = currentIndex - 1;
                }
            } else {
                return;
            }

            if (targetIndex !== currentIndex) {
                event.preventDefault();
                scrollToSection(sections[targetIndex]);
            }
        },
        { passive: false },
    );

    // 수동 스크롤/리사이즈 시 활성 상태 업데이트
    window.addEventListener('scroll', updateCurrentIndexFromScroll);
    window.addEventListener('resize', updateCurrentIndexFromScroll);
});




// AOS 기본값 설정 ///////////////////////////////////////////////////////////////////////
AOS.init({
    duration: 800, // 기본 애니메이션 지속 시간
    once: false, // 애니메이션을 한 번만 실행할지 여부 (false = 스크롤할 때마다 재생)
    mirror: false, // 요소를 지나칠 때 애니메이션 반복 o/x
    delay: 0, // 지연 시간
    easing: 'ease-in-out', // 이징 함수
});


// GSAP float(둥둥떠있는 효과) 설정 //////////////////////////////////////////////////////
gsap.to(".float", {
    y: -12,               // 살짝만 떠오르도록 (너무 크면 출렁거림 느낌)
    duration: 1.3,        // 지속시간
    repeat: -1,           // 무한 반복
    yoyo: true,           // 위아래 왕복
    ease: "power1.inOut",   // 가속도
    stagger: {
        each: 0,         // 아이콘 사이 타이밍 간격
        from: "random"      // 시작 위치를 랜덤으로 해서 동시에 움직이지 않게
    }
});


// 임시로 header nav의 ul li a 태그 이동 기능 막기 함수
// 개발/테스트 목적: true로 설정하면 언어 선택 링크 클릭해도 이동하지 않음
const DISABLE_LANG_LINKS_NAVIGATION = true; // false = 정상 작동, true = 이동 막기
const preventLangNavigation = (event) => event.preventDefault();

// 언어 선택 링크 네비게이션 비활성화 함수
function disableLangLinksNavigation() {
    const langLinks = document.querySelectorAll('header nav ul li a'); // 한국어, ENG, 日本語 링크들

    langLinks.forEach((link) => {
        if (DISABLE_LANG_LINKS_NAVIGATION) {
            link.addEventListener('click', preventLangNavigation);
            // 시각적 표시: 비활성화 상태 표시
            link.style.opacity = '0.5';
            link.style.cursor = 'not-allowed';
            link.style.pointerEvents = 'none';
        } else {
            link.removeEventListener('click', preventLangNavigation);
            // 스타일 복원
            link.style.opacity = '';
            link.style.cursor = '';
            link.style.pointerEvents = '';
        }
    });
}

// main(hero) 영역 텍스트(quote) GSAP 애니메이션 함수
function initQuoteAnimation() {
    const quoteElement = document.getElementById('quote');

    if (!quoteElement || !window.gsap) {
        return;
    }

    const fragment = document.createDocumentFragment();

    Array.from(quoteElement.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent.split('').forEach((char) => {
                const span = document.createElement('span');
                span.className = 'quote-char';
                span.textContent = char === ' ' ? '\u00A0' : char;
                fragment.appendChild(span);
            });
        } else if (node.nodeName === 'BR') {
            fragment.appendChild(node.cloneNode());
        } else {
            fragment.appendChild(node.cloneNode(true));
        }
    });

    quoteElement.innerHTML = '';
    quoteElement.appendChild(fragment);

    const chars = quoteElement.querySelectorAll('.quote-char');

    if (!chars.length) {
        return;
    }

    gsap.fromTo(
        chars,
        { fontWeight: 200 },
        {
            fontWeight: 800,
            duration: 1,
            ease: 'power3.out',
            stagger: {
                each: 0.06,
                from: 'start',
            },
        },
    );
}

// 언어 선택 드롭다운 메뉴 제어 함수
function initLangDropdown() {
    const langNav = document.querySelector('header nav.lang-nav');
    const langBtn = langNav?.querySelector('.lang-btn');
    const langList = langNav?.querySelector('ul.lang-list-wrap');

    if (!langNav || !langBtn || !langList) {
        return;
    }

    // .lang-btn에 마우스 진입 시 메뉴 열기
    langBtn.addEventListener('mouseenter', () => {
        langList.classList.add('is-open');
    });

    // .lang-nav 또는 .lang-list-wrap에서 마우스가 완전히 벗어났을 때만 메뉴 닫기
    function handleLangAreaLeave(event) {
        const relatedTarget = event.relatedTarget;
        const isInsideLangArea = Boolean(
            relatedTarget && (langNav.contains(relatedTarget) || langList.contains(relatedTarget)),
        );

        if (isInsideLangArea) {
            return;
        }

        langList.classList.remove('is-open');
    }

    langNav.addEventListener('mouseleave', handleLangAreaLeave);
    langList.addEventListener('mouseleave', handleLangAreaLeave);
}

// 페이지 로드 시 설정 적용
document.addEventListener('DOMContentLoaded', () => {
    disableLangLinksNavigation();
    initQuoteAnimation();
    initLangDropdown();
});
