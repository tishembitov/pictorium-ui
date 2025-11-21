import type { Pin } from '@/types'

/**
 * Mock данные для тестирования пинов
 */

// Базовый пин
const createMockPin = (overrides: Partial<Pin> = {}): Pin => ({
  id: Math.random().toString(36).substr(2, 9),
  userId: 'user123',
  title: 'Test Pin',
  description: 'Test description',
  href: null,
  imageUrl: 'image123',
  thumbnailUrl: null,
  videoPreviewUrl: null,
  rgb: '#808080',
  width: 400,
  height: 600,
  fileSize: 1024000,
  contentType: 'image/jpeg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: ['test'],
  isLiked: false,
  isSaved: false,
  saveCount: 0,
  commentCount: 0,
  likeCount: 0,
  viewCount: 0,
  ...overrides,
})

// Горизонтальный пин (широкий)
export const horizontalPin: Pin = createMockPin({
  id: 'horizontal-1',
  title: 'Horizontal Pin (Wide)',
  width: 800,
  height: 400,
  rgb: '#FF6B6B',
  imageUrl: 'https://picsum.photos/800/400?random=1',
})

// Вертикальный пин (высокий)
export const verticalPin: Pin = createMockPin({
  id: 'vertical-1',
  title: 'Vertical Pin (Tall)',
  width: 400,
  height: 800,
  rgb: '#4ECDC4',
  imageUrl: 'https://picsum.photos/400/800?random=2',
})

// Квадратный пин
export const squarePin: Pin = createMockPin({
  id: 'square-1',
  title: 'Square Pin',
  width: 600,
  height: 600,
  rgb: '#FFE66D',
  imageUrl: 'https://picsum.photos/600/600?random=3',
})

// Пин с длинным заголовком
export const longTitlePin: Pin = createMockPin({
  id: 'long-title-1',
  title:
    'This is a very long pin title that should be truncated or wrapped correctly to test text overflow behavior in the UI component',
  description: 'Short description',
  width: 500,
  height: 700,
  rgb: '#95E1D3',
  imageUrl: 'https://picsum.photos/500/700?random=4',
})

// Пин с длинным описанием
export const longDescriptionPin: Pin = createMockPin({
  id: 'long-desc-1',
  title: 'Pin with Long Description',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  width: 450,
  height: 650,
  rgb: '#F38181',
  imageUrl: 'https://picsum.photos/450/650?random=5',
})

// Пин с множеством тегов
export const manyTagsPin: Pin = createMockPin({
  id: 'tags-1',
  title: 'Pin with Many Tags',
  tags: [
    'nature',
    'landscape',
    'mountains',
    'sunset',
    'photography',
    'travel',
    'adventure',
    'outdoors',
    'hiking',
    'camping',
  ],
  width: 600,
  height: 400,
  rgb: '#AA96DA',
  imageUrl: 'https://picsum.photos/600/400?random=6',
})

// Пин с лайками и комментариями
export const popularPin: Pin = createMockPin({
  id: 'popular-1',
  title: 'Popular Pin',
  description: 'This pin has many likes and comments',
  likeCount: 1234,
  commentCount: 56,
  saveCount: 789,
  viewCount: 9876,
  isLiked: true,
  isSaved: true,
  width: 500,
  height: 750,
  rgb: '#FCBAD3',
  imageUrl: 'https://picsum.photos/500/750?random=7',
})

// Пин без заголовка
export const noTitlePin: Pin = createMockPin({
  id: 'no-title-1',
  title: null,
  description: 'Pin without title',
  width: 550,
  height: 450,
  rgb: '#FFFFD2',
  imageUrl: 'https://picsum.photos/550/450?random=8',
})

// Пин без описания
export const noDescriptionPin: Pin = createMockPin({
  id: 'no-desc-1',
  title: 'Pin Without Description',
  description: null,
  width: 480,
  height: 720,
  rgb: '#A8D8EA',
  imageUrl: 'https://picsum.photos/480/720?random=9',
})

// Пин с ссылкой
export const linkPin: Pin = createMockPin({
  id: 'link-1',
  title: 'Pin with External Link',
  description: 'Click to visit website',
  href: 'https://example.com',
  width: 600,
  height: 500,
  rgb: '#FFAAA5',
  imageUrl: 'https://picsum.photos/600/500?random=10',
})

// GIF пин (симуляция)
export const gifPin: Pin = createMockPin({
  id: 'gif-1',
  title: 'Animated GIF',
  description: 'This is an animated GIF',
  contentType: 'image/gif',
  width: 400,
  height: 400,
  rgb: '#FFD3B6',
  imageUrl: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
})

// Видео пин (симуляция)
export const videoPin: Pin = createMockPin({
  id: 'video-1',
  title: 'Video Pin',
  description: 'This is a video',
  contentType: 'video/mp4',
  videoPreviewUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  width: 640,
  height: 360,
  rgb: '#FFC8C8',
  imageUrl: null,
})

// Очень маленький пин
export const tinyPin: Pin = createMockPin({
  id: 'tiny-1',
  title: 'Tiny Pin',
  width: 200,
  height: 300,
  rgb: '#C7CEEA',
  imageUrl: 'https://picsum.photos/200/300?random=11',
})

// Огромный пин
export const hugePin: Pin = createMockPin({
  id: 'huge-1',
  title: 'Huge Pin',
  width: 1200,
  height: 1800,
  rgb: '#B5EAD7',
  imageUrl: 'https://picsum.photos/1200/1800?random=12',
})

// Пины с разными aspect ratios
export const aspectRatioPins: Pin[] = [
  createMockPin({
    id: 'ar-1',
    title: '1:1 (Square)',
    width: 500,
    height: 500,
    rgb: '#FF6B6B',
    imageUrl: 'https://picsum.photos/500/500?random=20',
  }),
  createMockPin({
    id: 'ar-2',
    title: '4:3 (Standard)',
    width: 640,
    height: 480,
    rgb: '#4ECDC4',
    imageUrl: 'https://picsum.photos/640/480?random=21',
  }),
  createMockPin({
    id: 'ar-3',
    title: '16:9 (Widescreen)',
    width: 1920,
    height: 1080,
    rgb: '#FFE66D',
    imageUrl: 'https://picsum.photos/1920/1080?random=22',
  }),
  createMockPin({
    id: 'ar-4',
    title: '9:16 (Portrait)',
    width: 1080,
    height: 1920,
    rgb: '#95E1D3',
    imageUrl: 'https://picsum.photos/1080/1920?random=23',
  }),
  createMockPin({
    id: 'ar-5',
    title: '21:9 (Ultrawide)',
    width: 2560,
    height: 1080,
    rgb: '#F38181',
    imageUrl: 'https://picsum.photos/2560/1080?random=24',
  }),
]

// Набор пинов для grid тестирования
export const gridPins: Pin[] = Array.from({ length: 20 }, (_, i) =>
  createMockPin({
    id: `grid-${i}`,
    title: `Grid Pin #${i + 1}`,
    description: `Test pin ${i + 1} for grid layout`,
    width: 300 + Math.random() * 400,
    height: 400 + Math.random() * 600,
    rgb: `hsl(${Math.random() * 360}, 70%, 80%)`,
    imageUrl: `https://picsum.photos/${400 + Math.floor(Math.random() * 400)}/${500 + Math.floor(Math.random() * 500)}?random=${i + 30}`,
    likeCount: Math.floor(Math.random() * 1000),
    commentCount: Math.floor(Math.random() * 100),
    saveCount: Math.floor(Math.random() * 500),
  }),
)

// Все тестовые пины
export const allTestPins: Pin[] = [
  horizontalPin,
  verticalPin,
  squarePin,
  longTitlePin,
  longDescriptionPin,
  manyTagsPin,
  popularPin,
  noTitlePin,
  noDescriptionPin,
  linkPin,
  gifPin,
  videoPin,
  tinyPin,
  hugePin,
  ...aspectRatioPins,
  ...gridPins,
]

// Группы для тестирования
export const pinGroups = {
  sizes: [tinyPin, squarePin, hugePin],
  shapes: [horizontalPin, verticalPin, squarePin],
  content: [longTitlePin, longDescriptionPin, manyTagsPin],
  states: [popularPin, noTitlePin, noDescriptionPin],
  media: [gifPin, videoPin, linkPin],
  aspectRatios: aspectRatioPins,
  grid: gridPins,
  all: allTestPins,
}

// Функция для генерации случайных пинов
export function generateRandomPins(count: number): Pin[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPin({
      id: `random-${i}-${Date.now()}`,
      title: `Random Pin #${i + 1}`,
      width: 300 + Math.random() * 500,
      height: 400 + Math.random() * 800,
      rgb: `hsl(${Math.random() * 360}, 70%, 80%)`,
      imageUrl: `https://picsum.photos/${400 + Math.floor(Math.random() * 400)}/${500 + Math.floor(Math.random() * 500)}?random=${Date.now() + i}`,
    }),
  )
}
