# Установка ComfyUI на локальный компьютер

## Подготовка

- установите Python 3.10, другие версии могут не поддерживаться, а могут и поддерживаться ;)
- установите git
- для macOS версия операционной системы 10.15 или новее
- желательно иметь дискретную карту NVidia или Apple Silicon для ускорения генерации, но в принципе должно работать и на CPU

## Установка

### Клонируйте репозиторий:

```
git clone https://github.com/comfyanonymous/ComfyUI.git
```

### Перейдите в папку проекта

```
cd ComfyUI
```

### Создайте виртуальное окружение

```
python3.10 -m venv venv
```

### Активируйте виртуальное окружение

Команда для Mac и Linux:
```
source venv/bin/activate
```


### Обновите pip до последней версии и установите зависимости:

```
pip install --upgrade pip

pip install -r requirements.txt
```



### Настройте поддержку ускорения (опционально)

Для ускорения генерации изображений рекомендуется установить зависимости для работы с GPU.

Если у вас Apple Silicon (M1/M2...), установите PyTorch с поддержкой Metal:

```
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

Если у вас дискретная NVIDIA GPU, установите PyTorch с поддержкой CUDA:

```
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Запустите ComfyUI

Запустите сервер:

```
python main.py --force-fp32
```


После запуска вы увидите сообщение, что сервер работает. Обычно интерфейс доступен по адресу:

```
http://127.0.0.1:8188
```

### (Опционально) Установите модели

Скачайте модели и поместите их в правильную папку:

#### Рекомендуемые модели

##### *Модели генерации*, их нужно размещать в папке
```
models/checkpoints
```
Универсальная модель Deliberate v6

https://huggingface.co/XpucT/Deliberate/blob/main/Deliberate_v6.safetensors

Модель для генерации человекоподобных животных Midgard Pony

https://civitai.com/models/470287?modelVersionId=561310

Стандартная часто используемая модель

https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

Refiter

https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0/resolve/main/sd_xl_refiner_1.0.safetensors

##### *Модели для UpScale* - увеличения размера/качества изображения, их нужно размещать в папке
```
models/upscale_models
```
Универсальная модель

https://huggingface.co/gemasai/4x_NMKD-Superscale-SP_178000_G/raw/main/4x_NMKD-Superscale-SP_178000_G.pth

### Автоматизируйте запуск (опционально)
    
Чтобы не запускать ComfyUI вручную каждый раз cоздайте shell-скрипт (для Mac и Linux):

```
echo 'cd ~/ComfyUI && source venv/bin/activate && python main.py' > start_comfyui.sh
chmod +x start_comfyui.sh
```


### Запускайте сервер, выполняя скрипт:

```
./start_comfyui.sh
```

Готово!

# Полезные ссылки по теме:

## где можно скачать готовые workflow

https://rundiffusion.com/comfyui-workflows

https://comfyworkflows.com/

https://github.com/hashmil/comfyUI-workflows

https://github.com/cubiq/ComfyUI_Workflows

https://openart.ai/workflows


# Сравнительная таблица популярных сэмплеров в ComfyUI:

<table border="1">
<tr>
<th>Сэмплер</th><th>Метод</th><th>Скорость</th><th>Детализация</th><th>Вариативность</th><th>Особенности</th><tr>
<tr><td>Euler</td><td>Детерминированный (ODE)</td><td>🚀 Быстрый</td><td>🎯 Хорошая</td><td>🔄 Низкая</td><td>Четкие, стабильные результаты</td></tr>
<tr><td>Euler a</td><td>Стохастический (Ancestral)</td><td>⚡ Быстрее средн.</td><td>🎭 Средняя</td><td>	🔄🔄 Выше</td><td>Более креативные и “живые” изображения</td></tr>
<tr><td>DPM++ 2M Karras</td><td>Детерминированный (ODE)	</td><td>🚀 Очень быстрый</td><td>	🎯 Высокая</td><td>	🔄 Низкая</td><td>	Хорошо сохраняет детали, популярен в SDXL</td></tr>
<tr><td>DPM++ SDE Karras</td><td>	Стохастический (SDE)</td><td>	🔄 Средний</td><td>	🎭 Средняя</td><td>	🔄🔄 Выше</td><td>	Мягкие текстуры, подходит для художественных изображений</td></tr>
<tr><td>DPM++ 2M SDE Karras	</td><td>Комбинированный (SDE+ODE)</td><td>	🔄 Средний</td><td>	🎯 Высокая</td><td>	🔄 Средняя	</td><td>Отличный баланс качества и скорости</td></tr>
<tr><td>Heun</td><td>	Улучшенный метод Эйлера</td><td>	⚡ Быстрее средн.</td><td>	🎭 Средняя</td><td>	🔄 Средняя</td><td>	Компромисс между четкостью и плавностью</td></tr>
<tr><td>LMS</td><td>	Детерминированный (ODE)</td><td>	🔄 Средний</td><td>	🎯 Высокая</td><td>	🔄 Низкая	</td><td>Хорош для резких и четких изображений</td></tr>
<tr><td>LMS Karras</td><td>	Улучшенный LMS</td><td>	⚡ Быстрее средн.</td><td>	🎯 Высокая</td><td>	🔄 Низкая</td><td>	Четкие контуры, хорошо подходит для деталей</td></tr>
<tr><td>DDIM</td><td>	Стохастический (SDE)</td><td>	⚡ Быстрее средн.</td><td>	🎭 Средняя	</td><td>🔄🔄 Выше</td><td>	Гладкие результаты, хорош для анимации</td></tr>
<tr><td>PLMS	</td><td>Улучшенный метод Ланцоша	</td><td>🚀 Быстрый</td><td>	🎭 Средняя</td><td>	🔄 Средняя</td><td>	Баланс скорости и качества</td></tr>
<tr><td>UniPC</td><td>	Универсальный прогнозирующий корректор</td><td>	🔄 Средний	</td><td>🎯 Высокая	</td><td>🔄 Средняя</td><td>	Хороший выбор для сложных сцен</td></tr>

</table>
Какой сэмплер выбрать?

✅ Для скорости: Euler, DPM++ 2M Karras, PLMS

✅ Для качества: DPM++ 2M SDE Karras, LMS Karras, UniPC

✅ Для вариативности: Euler a, DDIM, DPM++ SDE Karras

✅ Для плавных текстур: Heun, DDIM, DPM++ SDE Karras

🔹 DPM++ 2M Karras – один из лучших балансных вариантов для детализированных изображений.

🔹 Euler a – лучший выбор, если хочется больше креативности и случайности.
