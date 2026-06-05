source "https://rubygems.org"

# GitHub Pages가 사용하는 버전과 동일하게 빌드합니다.
gem "github-pages", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-seo-tag"
end

# Windows / JRuby 환경 보조 gem
gem "wdm", ">= 0.2.0", :platforms => [:mingw, :x64_mingw, :mswin]
gem "tzinfo-data", :platforms => [:mingw, :x64_mingw, :mswin, :jruby]

# Ruby 3.x 에서 `jekyll serve` 실행에 필요 (stdlib에서 제외됨)
gem "webrick", "~> 1.8"
