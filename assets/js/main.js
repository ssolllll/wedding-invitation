/* ============================================================
   모바일 청첩장 스크립트
   - 달력 렌더링, D-day 카운트다운, 계좌 복사, 아코디언, 스크롤 애니메이션
   ============================================================ */

(function () {
  'use strict';

  var weddingDate = new Date(document.body.dataset.weddingDate);

  /* ---------- 달력 ---------- */
  function renderCalendar() {
    var el = document.getElementById('calendar');
    if (!el || isNaN(weddingDate)) return;

    var year = weddingDate.getFullYear();
    var month = weddingDate.getMonth(); // 0-based
    var weddingDay = weddingDate.getDate();
    var firstDow = new Date(year, month, 1).getDay();
    var lastDate = new Date(year, month + 1, 0).getDate();
    var dows = ['일', '월', '화', '수', '목', '금', '토'];

    var html = '<p class="calendar__month">' + year + '. ' + String(month + 1).padStart(2, '0') + '</p>';
    html += '<div class="calendar__grid">';

    dows.forEach(function (d, i) {
      html += '<span class="calendar__dow' + (i === 0 ? ' calendar__dow--sun' : '') + '">' + d + '</span>';
    });

    for (var b = 0; b < firstDow; b++) html += '<span></span>';

    for (var day = 1; day <= lastDate; day++) {
      var dow = (firstDow + day - 1) % 7;
      var cls = 'calendar__day';
      if (dow === 0) cls += ' calendar__day--sun';
      if (day === weddingDay) cls += ' calendar__day--wedding';
      html += '<span class="' + cls + '">' + day + '</span>';
    }

    html += '</div>';
    el.innerHTML = html;
  }

  /* ---------- D-day 카운트다운 ---------- */
  function updateCountdown() {
    var box = document.getElementById('countdown');
    var msg = document.getElementById('cd-message');
    if (!box || isNaN(weddingDate)) return;

    var diff = weddingDate.getTime() - Date.now();

    if (diff <= 0) {
      box.style.display = 'none';
      if (msg) msg.innerHTML = '두 사람이 부부가 되었습니다. 축복해 주셔서 감사합니다 <strong>&hearts;</strong>';
      return;
    }

    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400);
    var hours = Math.floor((s % 86400) / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;

    document.getElementById('cd-days').textContent = days;
    document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
    document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');

    if (msg) {
      msg.innerHTML = '결혼식까지 <strong>D-' + days + '</strong> 남았습니다';
    }
  }

  /* ---------- 토스트 ---------- */
  var toastTimer = null;
  function showToast(text) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2000);
  }

  /* ---------- 클립보드 복사 ---------- */
  function copyText(text, doneMessage) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(doneMessage);
      } catch (e) {
        showToast('복사에 실패했습니다');
      }
      document.body.removeChild(ta);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(doneMessage);
      }, fallback);
    } else {
      fallback();
    }
  }

  document.querySelectorAll('.btn--copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      copyText(btn.dataset.copy, '계좌번호가 복사되었습니다');
    });
  });

  var shareBtn = document.getElementById('share-link');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      copyText(window.location.href, '청첩장 링크가 복사되었습니다');
    });
  }

  /* ---------- 아코디언 ---------- */
  document.querySelectorAll('.accordion__header').forEach(function (header) {
    header.addEventListener('click', function () {
      var acc = header.parentElement;
      var open = acc.classList.toggle('is-open');
      header.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- 스크롤 등장 애니메이션 (순차 등장) ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 섹션마다 .reveal 요소에 시간차(stagger)를 부여 → 하나씩 순서대로 등장
  document.querySelectorAll('.cover, .section, .closing').forEach(function (section) {
    var step = section.classList.contains('cover') ? 240 : 110; // 표지는 인트로 시퀀스처럼 여유 있게
    section.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * step, 1400) + 'ms';
    });
  });

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 패럴랙스 (스크롤보다 느리게 움직이는 깊이감) ---------- */
  function initParallax() {
    if (reduceMotion) return;
    var els = [].slice.call(document.querySelectorAll('[data-parallax]'));
    if (!els.length) return;

    var items = [];

    function measure() {
      var scrollY = window.pageYOffset;
      items = els.map(function (el) {
        el.style.transform = ''; // 측정 전 transform 초기화
        var rect = el.getBoundingClientRect();
        return {
          el: el,
          speed: parseFloat(el.dataset.parallax) || 0.1,
          center: rect.top + scrollY + rect.height / 2,
          height: rect.height
        };
      });
    }

    var ticking = false;

    function apply() {
      ticking = false;
      var scrollY = window.pageYOffset;
      var vh = window.innerHeight;
      items.forEach(function (item) {
        // 화면 밖이면 건너뛰기
        var top = item.center - item.height / 2 - scrollY;
        if (top > vh + 80 || top + item.height < -80) return;
        var offset = (item.center - scrollY - vh / 2) * -item.speed;
        item.el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    measure();
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); apply(); });
  }

  initParallax();

  /* ---------- 단풍잎 떨어지는 효과 ---------- */
  function initFallingLeaves() {
    var canvas = document.getElementById('leaves');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.remove();
      return;
    }

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H;
    var GLYPHS = ['🍁', '🍂']; // 🍁 🍂
    var steadyCount = parseInt(canvas.dataset.count, 10) || 16;
    var burstCount = parseInt(canvas.dataset.burst, 10) || 26;
    var leaves = [];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function makeLeaf(isBurst) {
      return {
        glyph: GLYPHS[Math.random() < 0.7 ? 0 : 1],
        x: Math.random() * W,
        // 인트로 버스트는 화면 전체에 흩뿌리고, 평상시엔 화면 위에서 시작
        y: isBurst ? Math.random() * H * 0.9 - H * 0.2 : -40 - Math.random() * H * 0.3,
        size: 14 + Math.random() * 18,
        speedY: 0.5 + Math.random() * 1.1,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        swayAmp: 24 + Math.random() * 36,
        swayFreq: 0.004 + Math.random() * 0.004,
        swayPhase: Math.random() * Math.PI * 2,
        alpha: 0.55 + Math.random() * 0.4,
        burst: !!isBurst
      };
    }

    // 첫 진입: 화면 가득 흩날리는 인트로 버스트 + 평상시 유지분
    for (var i = 0; i < burstCount; i++) leaves.push(makeLeaf(true));
    for (var j = 0; j < steadyCount; j++) leaves.push(makeLeaf(false));

    var start = performance.now();

    function tick(now) {
      ctx.clearRect(0, 0, W, H);
      var t = now - start;

      for (var k = 0; k < leaves.length; k++) {
        var leaf = leaves[k];
        leaf.y += leaf.speedY;
        leaf.rot += leaf.rotSpeed;
        var sway = Math.sin(t * leaf.swayFreq + leaf.swayPhase) * leaf.swayAmp;

        if (leaf.y > H + 50) {
          if (leaf.burst) {
            // 인트로용 잎은 한 번 떨어지면 제거 → 이후엔 잔잔한 효과만 유지
            leaves.splice(k, 1);
            k--;
            continue;
          }
          leaves[k] = makeLeaf(false);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = leaf.alpha;
        ctx.translate(leaf.x + sway, leaf.y);
        ctx.rotate(leaf.rot);
        ctx.font = leaf.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(leaf.glyph, 0, 0);
        ctx.restore();
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ---------- 초기화 ---------- */
  renderCalendar();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  initFallingLeaves();
})();
