<Button appearance="primary">
  <Stack horizontal tokens={{ childrenGap: 8 }}>
    <AddIcon />
    <Text>Добавить</Text>
  </Stack>
</Button>

// Карточка с текстом и кнопками
<Card>
  <CardHeader>
    <Text variant="large">Заголовок</Text>
  </CardHeader>
  <CardContent>
    <Text>Описание</Text>
  </CardContent>
  <CardFooter>
    <Stack horizontal tokens={{ childrenGap: 8 }}>
      <Button appearance="secondary">Отмена</Button>
      <Button appearance="primary">Сохранить</Button>
    </Stack>
  </CardFooter>
</Card>

// Форма с текстом и кнопками
<Stack tokens={{ childrenGap: 16 }}>
  <Text variant="large">Форма</Text>
  <Label htmlFor="name">Имя</Label>
  <Input id="name" />
  <Stack horizontal tokens={{ childrenGap: 8 }}>
    <Button appearance="secondary">Отмена</Button>
    <Button appearance="primary">Сохранить</Button>
  </Stack>
</Stack>

// Уведомление с текстом и кнопкой
<MessageBar
  messageBarType={MessageBarType.info}
  actions={
    <Button appearance="primary">Действие</Button>
  }
>
  <Text>Информационное сообщение</Text>
</MessageBar>