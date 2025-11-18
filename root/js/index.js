// index.js
// Side pager full-page 스크롤 함수 ////////////////////////////////////////////////////////////
$(function () {
    const $window = $(window);
    const $htmlBody = $('html, body');
    const $header = $('header');
    const $pager = $('.side-pager');
    const $pagerItems = $pager.find('li');
    const $pagerLinks = $pager.find('a');
    const animationDuration = 800;
    // DOM 순서대로 모든 섹션(#p1 ~ #p9) 수집
    const $sections = $('[id^="p"]').filter(function () {
        return /^p\d+$/.test(this.id);
    });
    let currentIndex = 0;
    let isAnimating = false;


    //side-pager와 header #p9일때 숨김 처리
    // 1. nav.side-pager 숨김/드러남 함수: 사용자가 보는 위치가 #p9일 때는 side-pager가 보이지 않아야 하고, #p1~#p8일 때는 보여야 함
    function applySidePagerState(id) {
        const shouldHidePager = id === 'p9';
        $pager.toggleClass('is-hidden', shouldHidePager);
    }

    // 2. header 숨김/드러남 함수: 사용자가 보는 위치가 #p9일 때는 header가 보이지 않아야 하고, #p1~#p8일 때는 보여야 함
    function applyHeaderState(id) {
        const shouldHideHeader = id === 'p9';
        $header.toggleClass('is-hidden', shouldHideHeader);
    }

    function setActiveById(id) {
        const targetHash = `#${id}`;
        // 'on' 클래스 제거 및 빈 class 속성 정리
        $pagerItems.removeClass('on').each(function () {
            if (!this.className) {
                $(this).removeAttr('class');
            }
        });
        // 대상 li에 'on' 클래스 추가
        $pagerLinks.each(function () {
            if ($(this).attr('href') === targetHash) {
                $(this).parent().addClass('on');
                return false;
            }
        });

        // side-pager와 header 숨김/드러남 상태 동기화
        applySidePagerState(id);
        applyHeaderState(id);
    }

    function scrollToSection($target) {
        if (!$target.length) {
            return;
        }
        const targetIndex = $sections.index($target);
        if (targetIndex === -1) {
            return;
        }
        const targetTop = $target.offset().top;
        isAnimating = true;
        currentIndex = targetIndex;
        setActiveById($target.attr('id'));
        $htmlBody.stop(true).animate({ scrollTop: targetTop }, animationDuration, 'swing', function () {
            isAnimating = false;
        });
    }
    function updateCurrentIndexFromScroll() {
        if (isAnimating) {
            return;
        }
        const scrollTop = $window.scrollTop();
        const viewportHeight = $window.height();
        let newIndex = currentIndex;
        $sections.each(function (idx) {
            const $section = $(this);
            const sectionTop = $section.offset().top;
            if (scrollTop >= sectionTop - viewportHeight / 2) {
                newIndex = idx;
            }
        });
        if (newIndex !== currentIndex) {
            currentIndex = newIndex;
            setActiveById($sections.eq(currentIndex).attr('id'));
        }
    }
    // 현재 스크롤 위치를 기반으로 초기 활성화
    updateCurrentIndexFromScroll();
    if ($sections.length) {
        setActiveById($sections.eq(currentIndex).attr('id'));
    }
    // 페이저 클릭 핸들러
    $pagerLinks.on('click', function (event) {
        event.preventDefault();
        const targetId = $(this).attr('href');
        if (!targetId) {
            return;
        }
        const $targetSection = $(targetId);
        scrollToSection($targetSection);
        // :focus 스타일이 지속되지 않도록 포커스 제거
        $(this).blur();
    });
    // 마우스 휠 네비게이션
    $window.on('wheel', function (event) {
        if (isAnimating || !$sections.length) {
            return;
        }
        const deltaY = event.originalEvent.deltaY;
        let targetIndex = currentIndex;
        if (deltaY > 0 && currentIndex < $sections.length - 1) {
            targetIndex = currentIndex + 1;
        } else if (deltaY < 0 && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        }
        if (targetIndex !== currentIndex) {
            event.preventDefault();
            scrollToSection($sections.eq(targetIndex));
        }
    });
    // 수동 스크롤/리사이즈 시 활성 상태 업데이트
    $window.on('scroll resize', function () {
        updateCurrentIndexFromScroll();
    });
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

// GSAP rotate(회전효과) 설정 //////////////////////////////////////////////////////
gsap.to(".rotate", {
    rotation: 360,
    duration: 6,          // 1바퀴 도는 시간 (짧을수록 빨라짐)
    ease: "linear",       // 일정 속도 (멈춤X, 가감속X)
    repeat: -1            // 무한 반복
});


// 임시로 header nav의 ul li a 태그 이동 기능 막기 함수
// 개발/테스트 목적: true로 설정하면 언어 선택 링크 클릭해도 이동하지 않음
const DISABLE_LANG_LINKS_NAVIGATION = false; // false = 정상 작동, true = 이동 막기

// 언어 선택 링크 네비게이션 비활성화 함수
function disableLangLinksNavigation() {
    const $langLinks = $('header nav ul li a'); // 한국어, ENG, 日本語 링크들
    
    if (DISABLE_LANG_LINKS_NAVIGATION) {
        // 이동 기능 막기: 클릭 이벤트만 방지
        $langLinks.on('click.disable', function(event) {
            event.preventDefault();
        });
        
        // 시각적 표시: 비활성화 상태 표시
        $langLinks.css({
            'opacity': '0.5',
            'cursor': 'not-allowed',
            'pointer-events': 'none'
        });
        
    } else {
        // 이동 기능 활성화: 비활성화 이벤트 제거
        $langLinks.off('click.disable');
        
        // 스타일 복원
        $langLinks.css({
            'opacity': '',
            'cursor': '',
            'pointer-events': ''
        });
        
    }
}

// 페이지 로드 시 설정 적용
$(document).ready(function() {
    disableLangLinksNavigation();
});