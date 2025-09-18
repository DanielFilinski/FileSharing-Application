<Stack tokens={{ childrenGap: 16 }}>
  <Label htmlFor="name">Имя</Label>
  <Input id="name" />
  
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
  
  <Label htmlFor="role">Роль</Label>
  <Select id="role">
    <option value="admin">Администратор</option>
    <option value="user">Пользователь</option>
  </Select>
  
  <Checkbox label="Согласен с условиями" />
  
  <RadioGroup>
    <Radio value="option1" label="Опция 1" />
    <Radio value="option2" label="Опция 2" />
  </RadioGroup>
  
  <Button appearance="primary">Сохранить</Button>
</Stack>