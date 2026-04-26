"""comprehensive platform upgrade

Revision ID: g8h9i0j1k2l3
Revises: f1a2b3c4d5e6
Create Date: 2026-04-26 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'g8h9i0j1k2l3'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update OrderStatus enum
    op.execute("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing'")
    op.execute("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery'")
    op.execute("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded'")
    
    # Create product_variants table FIRST (before adding FK to it)
    op.create_table('product_variants',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=True),
        sa.Column('color', sa.String(length=50), nullable=True),
        sa.Column('size', sa.String(length=50), nullable=True),
        sa.Column('price_adjustment', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False),
        sa.Column('stock', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sku')
    )
    op.create_index(op.f('ix_product_variants_product_id'), 'product_variants', ['product_id'], unique=False)
    
    # Add delivery fields to orders
    op.add_column('orders', sa.Column('shipping_address', sa.Text(), nullable=True))
    op.add_column('orders', sa.Column('shipping_city', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('shipping_state', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('shipping_pincode', sa.String(length=20), nullable=True))
    op.add_column('orders', sa.Column('shipping_phone', sa.String(length=20), nullable=True))
    op.add_column('orders', sa.Column('tracking_number', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('courier_name', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('estimated_delivery', sa.DateTime(), nullable=True))
    op.add_column('orders', sa.Column('actual_delivery', sa.DateTime(), nullable=True))
    op.add_column('orders', sa.Column('customer_notes', sa.Text(), nullable=True))
    op.add_column('orders', sa.Column('admin_notes', sa.Text(), nullable=True))
    
    # Add fields to order_items (NOW that product_variants exists)
    op.add_column('order_items', sa.Column('variant_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('order_items', sa.Column('product_name', sa.String(length=300), nullable=True))
    op.add_column('order_items', sa.Column('variant_details', sa.String(length=200), nullable=True))
    op.create_foreign_key('fk_order_items_variant', 'order_items', 'product_variants', ['variant_id'], ['id'])
    
    # Create cart_items table
    op.create_table('cart_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('variant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['orgs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cart_items_org_id'), 'cart_items', ['org_id'], unique=False)
    op.create_index(op.f('ix_cart_items_user_id'), 'cart_items', ['user_id'], unique=False)
    
    # Create notifications table
    # Check if enum exists before creating
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE notification_type AS ENUM (
                'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 
                'order_cancelled', 'low_stock', 'org_request_approved', 'org_request_rejected',
                'new_review', 'payment_received'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', postgresql.ENUM('order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled', 'low_stock', 'org_request_approved', 'org_request_rejected', 'new_review', 'payment_received', name='notification_type', create_type=False), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('email_sent', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('email_sent_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['org_id'], ['orgs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    
    # Create order_queue table
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE queue_status AS ENUM ('pending', 'processing', 'completed', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.create_table('order_queue',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'processing', 'completed', 'failed', name='queue_status', create_type=False), server_default='pending', nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('locked_at', sa.DateTime(), nullable=True),
        sa.Column('locked_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['locked_by'], ['users.id']),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['org_id'], ['orgs.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )
    op.create_index(op.f('ix_order_queue_order_id'), 'order_queue', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_queue_org_id'), 'order_queue', ['org_id'], unique=False)
    
    # Create payment_ledger table
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transaction_type AS ENUM (
                'order_payment', 'refund', 'platform_fee', 'payout', 'subscription'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.create_table('payment_ledger',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('transaction_type', postgresql.ENUM('order_payment', 'refund', 'platform_fee', 'payout', 'subscription', name='transaction_type', create_type=False), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('platform_fee', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False),
        sa.Column('org_revenue', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('payment_gateway', sa.String(length=50), nullable=True),
        sa.Column('gateway_transaction_id', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.ForeignKeyConstraint(['org_id'], ['orgs.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_ledger_org_id'), 'payment_ledger', ['org_id'], unique=False)


def downgrade() -> None:
    # Drop new tables
    op.drop_index(op.f('ix_payment_ledger_org_id'), table_name='payment_ledger')
    op.drop_table('payment_ledger')
    op.execute('DROP TYPE transaction_type')
    
    op.drop_index(op.f('ix_order_queue_org_id'), table_name='order_queue')
    op.drop_index(op.f('ix_order_queue_order_id'), table_name='order_queue')
    op.drop_table('order_queue')
    op.execute('DROP TYPE queue_status')
    
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')
    op.execute('DROP TYPE notification_type')
    
    op.drop_index(op.f('ix_cart_items_user_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_org_id'), table_name='cart_items')
    op.drop_table('cart_items')
    
    op.drop_index(op.f('ix_product_variants_product_id'), table_name='product_variants')
    op.drop_table('product_variants')
    
    # Remove product columns
    op.drop_column('products', 'meta_description')
    op.drop_column('products', 'meta_title')
    op.drop_column('products', 'tags')
    op.drop_column('products', 'estimated_delivery_days')
    op.drop_column('products', 'free_shipping_threshold')
    op.drop_column('products', 'shipping_cost')
    op.drop_column('products', 'brand')
    op.drop_column('products', 'material')
    op.drop_column('products', 'dimensions')
    op.drop_column('products', 'weight')
    
    # Remove order_items columns
    op.drop_constraint('fk_order_items_variant', 'order_items', type_='foreignkey')
    op.drop_column('order_items', 'variant_details')
    op.drop_column('order_items', 'product_name')
    op.drop_column('order_items', 'variant_id')
    
    # Remove orders columns
    op.drop_column('orders', 'admin_notes')
    op.drop_column('orders', 'customer_notes')
    op.drop_column('orders', 'actual_delivery')
    op.drop_column('orders', 'estimated_delivery')
    op.drop_column('orders', 'courier_name')
    op.drop_column('orders', 'tracking_number')
    op.drop_column('orders', 'shipping_phone')
    op.drop_column('orders', 'shipping_pincode')
    op.drop_column('orders', 'shipping_state')
    op.drop_column('orders', 'shipping_city')
    op.drop_column('orders', 'shipping_address')
