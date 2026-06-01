// 다크/라이트 테마 토글 + localStorage 저장
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var saved = localStorage.getItem('theme');
  // 기본값은 항상 다크 테마. 사용자가 토글로 라이트를 고르면 그 선택만 기억합니다.
  var initial = saved || 'dark';

  apply(initial);

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    apply(next);
  });

  function apply(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      btn.textContent = '☀️';
    } else {
      root.removeAttribute('data-theme');
      btn.textContent = '🌙';
    }
  }
})();
