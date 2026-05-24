from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Transaction, Budget, Account
from django.db.models import Sum
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password


# Пользователь
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

# Регистрация
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    
# Счета
class AccountSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = ['id', 'name', 'type', 'balance', 'currency', 'is_default', 'is_active', 'created_at']
        read_only_fields = ['user', 'is_default', 'balance']

    def get_balance(self, obj):
        income = Transaction.objects.filter(
            account=obj, category__type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        expense = Transaction.objects.filter(
            account=obj, category__type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        return income - expense

    def validate(self, data):
        name = data.get("name")
        user = self.context['request'].user
        qs = Account.objects.filter(user=user, name__iexact=name)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Счет с таким названием уже существует")
        return data
    
# Категории
class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ('id', 'name', 'type', 'user', 'is_default')
        read_only_fields = ('user', 'is_default')

    def validate(self, data):
        name = data.get("name")

        qs = Category.objects.filter(name__iexact=name)

        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(
                "Категория с таким названием уже существует"
            )

        return data

# Транзакции
class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_type = serializers.CharField(source="category.type", read_only=True)
    account_name = serializers.CharField(source="account.name", read_only=True)      

    class Meta:
        model = Transaction
        fields = (
            'id',
            'category',
            'category_name',
            'category_type',
            'account',              
            'account_name',         
            'amount',
            'currency',
            'date',
            'description'
        )
        read_only_fields = ('user',)

    def validate_amount(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Сумма должна быть больше 0"
            )

        return value

# Бюджет
class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Budget
        fields = ["id", "category", "category_name", "limit", "month"]
