import { Button } from '@fluentui/react-components';

// Основные варианты кнопок
<Button appearance="primary">Основная кнопка</Button>
<Button appearance="secondary">Вторичная кнопка</Button>
<Button appearance="subtle">Тонкая кнопка</Button>
<Button appearance="transparent">Прозрачная кнопка</Button>

// Кнопки с иконками
<Button icon={<AddIcon />}>Добавить</Button>
<Button icon={<EditIcon />} iconPosition="after">Редактировать</Button>

// Кнопки с загрузкой
<Button loading>Загрузка</Button>

// Кнопки с отключением
<Button disabled>Отключено</Button>

// Кнопки разных размеров
<Button size="small">Маленькая</Button>
<Button size="medium">Средняя</Button>
<Button size="large">Большая</Button>

// Кнопки с подсказкой
<Tooltip content="Подсказка">
  <Button>Наведи на меня</Button>
</Tooltip>