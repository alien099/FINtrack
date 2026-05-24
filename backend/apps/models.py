from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    TYPE_CHOICES = [
        ('income', 'Доход'),
        ('expense', 'Расход')
    ]

    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('name', 'user')

    def __str__(self):
        return f"{self.name} ({self.type})"

class Transaction(models.Model):
    CURRENCY_CHOICES = [
        ('RUB', '₽'),
        ('EUR', '€'),
        ('USD', '$'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='RUB'
    )
    account = models.ForeignKey(                           
            'Account',
            on_delete=models.SET_NULL,
            null=True,
            blank=True,
            related_name='transactions'
    )
    date = models.DateField()
    description = models.CharField(max_length=255, blank=True)

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    limit = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.DateField()

    class Meta:
        unique_together = ('user', 'category', 'month')

    def __str__(self):
        return f"{self.user.username} - {self.category.name} - {self.limit}"
    
    
class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=[
        ('cash', 'Наличные'),
        ('card', 'Банковская карта'),
        ('deposit', 'Вклад/Счет'),
        ('credit', 'Кредитная карта'),
        ('other', 'Другое'),
    ], default='cash')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='RUB')
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_default', '-is_active', 'name']
        unique_together = [['user', 'name']]
    
    def save(self, *args, **kwargs):
        if not self.pk and not Account.objects.filter(user=self.user).exists():
            self.is_default = True
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"