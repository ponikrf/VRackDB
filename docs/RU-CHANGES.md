update 3.0.0
------------

### SchemeDB

 - Добавлен класс SchemeDB - Замена старого класса `Database`
 - Убрана работа с `MetricTree` (метод find). Теперь можно использовать класс `MetricTree` отдельно.
 - Метод `scheme` теперь используют именованные параметры 
 - Теперь в методе `scheme` можно определять параметр `CInterval` который управляет минимальным юнитом времени (прим. Секунды, миллисекунды, микросекунды)

### SingleDB

 - Добавлен класс SingleDB - Самый простой класс для работы с метриками. Каждая метрика в этом классе может иметь отличные от других метрик настройки. Этот класс является родителем класса `SchemeDB`

### Database 

 - Класс удален, теперь вместо него SchemeDB

### Layer 

 - Общий рефакторинг - переведен в стиль TypeScript
 - Изменение инициализации класса. Теперь используются именованные параметры
 - Метод size удален, и заменен на `Layer.length`
 - Теперь все внутренние настройки типа `interval`, `period` и тп доступны через "getters" только для чтения


### Collector

 - Общий рефакторинг - переведен в стиль TypeScript
 - Метод init теперь используют именованные параметры
 - Обновление внутренний документации
 - Теперь методы `Collector` используют `Interval` который был указан при создании метрики
 - Оптимизация хранения настроек метрик
 - Теперь все свойства класса определены как protected
 - Добавлен метод readFake для получения нерелевантных метрик
 - Добавлен метод info который возвращает доп. информацию о метрике (размер, начало первой записи, количество попыток записи в метрику)

### Interval

 - Обновление внутренний документации, теперь комментарии лучше отвечают за вопрос о том что делают методы.
 - Добавлено новое понятие MTU - минимальный юнит времени. MTU это единица времени представленная в виде целого числа. Например для класса Interval MTU = 1 секунда. Для IntervalMs MTU = 1 миллисекунда и т.п.
 - Внутренние интерфейсы теперь экспортируются для использования внутри других расширяющих классов типа IntervalMs
 - Добавлен метод getFactor() который возвращает множитель времени для получения MTU из стандартного времени JS. (Обычно в JS в качестве времени используются миллисекунды. Factor для получения MTU в Interval будет равен 0.001)
 - В стандарный набор интервалов добавлены еще 2 интервала - ms и us - миллисекунда и микросекунда соответсвенно
 - Теперь если результат преобразования интервала возвращает дробное число - он будет округлен
 - Исправлена проблема метода partOfPeriod. Раньше он мог выполнять только один тип операции в одном выражении, например вычислять `1m+10m+1h` но если нужно было использовать и `+` и `-` то это приводило к ошибке
 - Добавлены классы IntervalMs & IntervalUs для расчетов Ms и Us в качестве MTU